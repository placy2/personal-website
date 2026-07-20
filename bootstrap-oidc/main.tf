# Bootstrap: GitHub Actions OIDC provider + deploy role for placy2/personal-website.
#
# This is a standalone Terraform config, applied manually and locally. It does NOT
# share state (or a backend) with ../terraform — that config is what this role is
# permitted to manage, so bootstrapping it can't depend on it. State is local
# (terraform.tfstate in this directory); keep it, don't check it into git.
#
# After apply, replace the AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY secrets used by
# .github/workflows/deploy.yml with a single AWS_DEPLOY_ROLE_ARN secret (see output),
# and swap each `configure-aws-credentials` step to use `role-to-assume` instead of
# static keys.

terraform {
  required_version = ">= 1.13.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "github_repo" {
  description = "GitHub repo allowed to assume the deploy role, as OWNER/REPO"
  type        = string
  default     = "placy2/personal-website"
}

variable "terraform_state_bucket" {
  description = "S3 bucket holding personal-website terraform state (../terraform/provider.tf)"
  type        = string
  default     = "parker-terraform-backends"
}

variable "site_bucket_names" {
  description = "Site hosting buckets this role deploys to (../terraform/env/*.tfvars)"
  type        = list(string)
  default = [
    "parkerlacy-dev-hosting",
    "parkerlacy-website-hosting",
  ]
}

# GitHub's OIDC thumbprints are stable and documented by GitHub/AWS; AWS also
# verifies the token against its own trusted root, so this is mostly a formality
# required by the resource.
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = [
    data.tls_certificate.github.certificates[0].sha1_fingerprint,
  ]
}

# Trust policy scoped to exactly the workflow contexts that currently authenticate
# to AWS in .github/workflows/deploy.yml:
#   - terraform-plan / deploy-prod-plan: run on pushes to main (no `environment:`),
#     so the sub claim is ref-based.
#   - deploy-dev / deploy-prod-apply: use `environment: development` / `production`,
#     which switches the sub claim to the environment form.
# workflow_dispatch runs are included since they still target refs/heads/main.
data "aws_iam_policy_document" "github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:ref:refs/heads/main",
        "repo:${var.github_repo}:environment:development",
        "repo:${var.github_repo}:environment:production",
      ]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "personal-website-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
}

locals {
  # Bucket ARNs and their object ARNs. Bucket-level actions only match the
  # former and object-level actions only the latter, so a statement can list
  # both and each action still lands exactly where it applies.
  site_bucket_arns = flatten([
    for b in var.site_bucket_names : [
      "arn:aws:s3:::${b}",
      "arn:aws:s3:::${b}/*",
    ]
  ])
}

# Permissions mirror what ../terraform/main.tf manages: S3 site buckets (dev/prod),
# CloudFront, Route 53, ACM, plus S3 access to the shared terraform state bucket.
#
# Reads are granted as wildcards throughout. The AWS provider refreshes a long
# tail of legacy/computed attributes on every plan (bucket ACL/CORS/versioning/
# logging/lifecycle/replication, distribution tags, cert validation records, ...)
# whether or not this config manages them, so enumerating each Get*/List* as it
# surfaces is whack-a-mole with no natural end. Writes stay enumerated, except
# on the two site buckets this role wholly owns.
data "aws_iam_policy_document" "deploy_permissions" {
  # Get*/List* on the bucket ARN covers bucket metadata and key listing only —
  # GetObject requires an object ARN, and the sole object ARN here is this
  # project's state prefix. Other projects sharing the bucket stay unreadable.
  statement {
    sid    = "TerraformState"
    effect = "Allow"
    actions = [
      "s3:Get*",
      "s3:List*",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      "arn:aws:s3:::${var.terraform_state_bucket}",
      "arn:aws:s3:::${var.terraform_state_bucket}/terraform/personal-website/*",
    ]
  }

  # s3:* is scoped to these two buckets and nothing else. The role already needs
  # DeleteBucket and PutBucketPolicy on them, so it can destroy or expose them
  # regardless — enumerating the remaining verbs buys no real containment while
  # guaranteeing another AccessDenied the next time ../terraform grows a setting.
  statement {
    sid       = "SiteBuckets"
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = local.site_bucket_arns
  }

  statement {
    sid    = "EdgeRead"
    effect = "Allow"
    actions = [
      "cloudfront:Get*",
      "cloudfront:List*",
      "route53:Get*",
      "route53:List*",
      "acm:Describe*",
      "acm:Get*",
      "acm:List*",
    ]
    resources = ["*"]
  }

  # These services don't support resource-level ARN scoping for their create
  # actions, so "*" is the only option; keeping the verbs explicit is what bounds
  # this statement.
  statement {
    sid    = "EdgeWrite"
    effect = "Allow"
    actions = [
      "cloudfront:CreateDistribution",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:TagResource",
      "cloudfront:UntagResource",
      "cloudfront:CreateInvalidation",
      "route53:CreateHostedZone",
      "route53:DeleteHostedZone",
      "route53:ChangeResourceRecordSets",
      "route53:ChangeTagsForResource",
      "acm:RequestCertificate",
      "acm:DeleteCertificate",
      "acm:AddTagsToCertificate",
      "acm:RemoveTagsFromCertificate",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "deploy_permissions" {
  name   = "personal-website-deploy-permissions"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}

output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}

output "github_deploy_role_arn" {
  description = "Set this as the AWS_DEPLOY_ROLE_ARN GitHub secret"
  value       = aws_iam_role.github_deploy.arn
}
