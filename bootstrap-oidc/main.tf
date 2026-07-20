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

# Permissions mirror what ../terraform/main.tf manages: S3 site buckets (dev/prod),
# CloudFront, Route 53, ACM, plus S3 access to the shared terraform state bucket.
data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid       = "TerraformStateBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.terraform_state_bucket}"]
  }

  statement {
    sid    = "TerraformStateObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["arn:aws:s3:::${var.terraform_state_bucket}/terraform/personal-website/*"]
  }

  statement {
    sid    = "SiteBuckets"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:ListBucket",
      "s3:GetBucketPolicy",
      "s3:PutBucketPolicy",
      "s3:DeleteBucketPolicy",
      "s3:GetBucketPublicAccessBlock",
      "s3:PutBucketPublicAccessBlock",
      "s3:GetEncryptionConfiguration",
      "s3:PutEncryptionConfiguration",
      "s3:GetBucketWebsite",
      "s3:PutBucketWebsite",
      "s3:DeleteBucketWebsite",
      "s3:GetBucketTagging",
      "s3:PutBucketTagging",
    ]
    resources = [
      "arn:aws:s3:::parkerlacy-dev-hosting",
      "arn:aws:s3:::parkerlacy-website-hosting",
    ]
  }

  statement {
    sid    = "SiteObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      "arn:aws:s3:::parkerlacy-dev-hosting/*",
      "arn:aws:s3:::parkerlacy-website-hosting/*",
    ]
  }

  statement {
    sid    = "CloudFront"
    effect = "Allow"
    actions = [
      "cloudfront:GetDistribution",
      "cloudfront:CreateDistribution",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:TagResource",
      "cloudfront:UntagResource",
      "cloudfront:ListTagsForResource",
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListDistributions",
      "cloudfront:GetResponseHeadersPolicy",
      "cloudfront:ListResponseHeadersPolicies",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "Route53"
    effect = "Allow"
    actions = [
      "route53:GetHostedZone",
      "route53:CreateHostedZone",
      "route53:DeleteHostedZone",
      "route53:ChangeResourceRecordSets",
      "route53:ListResourceRecordSets",
      "route53:GetChange",
      "route53:ChangeTagsForResource",
      "route53:ListTagsForResource",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ACM"
    effect = "Allow"
    actions = [
      "acm:RequestCertificate",
      "acm:DescribeCertificate",
      "acm:DeleteCertificate",
      "acm:AddTagsToCertificate",
      "acm:RemoveTagsFromCertificate",
      "acm:ListTagsForCertificate",
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
