# https://pfertyk.me/2023/01/creating-a-static-website-with-terraform-and-aws/

resource "aws_s3_bucket" "bucket" {
  bucket        = var.bucket_name
  force_destroy = var.environment != "prod"
  tags          = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  bucket = aws_s3_bucket.bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Private bucket: only CloudFront (via OAC, see the policy below) can read it.
resource "aws_s3_bucket_public_access_block" "bucket_access_block" {
  depends_on = [aws_cloudfront_distribution.distribution]
  bucket     = aws_s3_bucket.bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  depends_on = [aws_s3_bucket_public_access_block.bucket_access_block]
  bucket     = aws_s3_bucket.bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "CloudFrontReadObjects"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.bucket.arn}/*"
        Condition = {
          StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.distribution.arn }
        }
      },
      # Lets S3 answer a missing key with 404 instead of 403.
      {
        Sid       = "CloudFrontListBucket"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.bucket.arn
        Condition = {
          StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.distribution.arn }
        }
      },
    ]
  })
}

# Site content (frontend/dist) is uploaded by scripts/upload-site.sh after
# apply, not by Terraform.

moved {
  from = aws_s3_bucket_website_configuration.hosting
  to   = aws_s3_bucket_website_configuration.hosting[0]
}

# Replaces the AWS managed SecurityHeadersPolicy. Keeps its nosniff,
# X-Frame-Options and Referrer-Policy values, adds a CSP and Permissions-Policy,
# adds includeSubDomains to HSTS, and drops the deprecated X-XSS-Protection.
#
# The CSP assumes the build is same-origin only: Vite emits external module
# scripts and stylesheets, and the only inline <script> blocks are
# type="application/ld+json" (data, not executed). Adding a third-party script,
# font, image or analytics beacon means updating this policy, or the browser
# will block it. Dev's distribution uses this same policy, so a violation shows
# up there first.
# HSTS preload is deliberately off: preload-list removal is slow and manual.
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.environment}-personal-website-security-headers"
  comment = "Security headers incl. CSP and Permissions-Policy for ${var.domain_name}"

  security_headers_config {
    content_security_policy {
      content_security_policy = join("; ", [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ])
      override = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = false
      override                   = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=()"
      override = true
    }
  }
}

# Viewer-request function: 301s www.<domain> to the apex and retired routes
# (/projects -> /work) to their replacement, and rewrites /about ->
# /about/index.html. The S3 REST origin has no index document, so that rewrite
# is what serves every page, including /. See functions/rewrite-index.js. (The
# resource name predates the redirects; renaming it would replace the function.)
resource "aws_cloudfront_function" "rewrite_index" {
  name    = "${var.environment}-personal-website-rewrite-index"
  runtime = "cloudfront-js-2.0"
  comment = "Map extensionless routes to their prerendered index.html"
  publish = true
  code    = file("${path.module}/functions/rewrite-index.js")
}

# Signs CloudFront's origin requests (SigV4) so the bucket policy can admit
# this distribution and nobody else.
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.environment}-personal-website-s3"
  description                       = "CloudFront access to the ${var.bucket_name} bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Both environments get a distribution. Dev has no custom domain and answers on
# its *.cloudfront.net name with the default certificate.
resource "aws_cloudfront_distribution" "distribution" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.environment} - ${var.domain_name}"

  # Unknown paths keep S3's real 404 status (the bucket policy grants
  # ListBucket, so S3 says 404 rather than 403). The REST endpoint's 404 body
  # is an XML error, so swap in index.html as the body and keep the 404.
  # main.tsx sees the data-prerendered-route mismatch and the app's catch-all
  # route renders "Page not found" client-side. Never remap to 200: that tells
  # crawlers every typo'd URL is a duplicate of the home page. 403 is left
  # unmapped so an origin-access misconfiguration stays visible.
  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  origin {
    domain_name              = aws_s3_bucket.bucket.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  # www is only ever answered with a 301 to the apex (functions/rewrite-index.js).
  aliases = local.custom_domain ? [var.domain_name, "www.${var.domain_name}"] : []

  viewer_certificate {
    acm_certificate_arn            = one(aws_acm_certificate_validation.cert[*].certificate_arn)
    cloudfront_default_certificate = !local.custom_domain
    ssl_support_method             = local.custom_domain ? "sni-only" : null
    # CloudFront pins the default *.cloudfront.net certificate to TLSv1.
    minimum_protocol_version = local.custom_domain ? "TLSv1.2_2021" : "TLSv1"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  default_cache_behavior {
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = aws_s3_bucket.bucket.bucket_regional_domain_name
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rewrite_index.arn
    }
  }

  price_class = "PriceClass_100"

  tags = local.common_tags
}

# These were count-gated on the removed enable_cloudfront variable.
moved {
  from = aws_cloudfront_distribution.distribution[0]
  to   = aws_cloudfront_distribution.distribution
}

moved {
  from = aws_cloudfront_function.rewrite_index[0]
  to   = aws_cloudfront_function.rewrite_index
}

moved {
  from = aws_cloudfront_response_headers_policy.security_headers[0]
  to   = aws_cloudfront_response_headers_policy.security_headers
}

# Route 53 hosted zone - only create if it's production environment
resource "aws_route53_zone" "zone" {
  count = var.environment == "prod" ? 1 : 0
  name  = var.domain_name
  tags  = local.common_tags

  lifecycle {
    prevent_destroy = true
  }
}

# ACM certificate - only create if it's production environment
# Expected to fail validation/hang first time, rerun once registrar steps are complete. 
# Can alternately target apply the zone first, and wait to apply the rest until dig NS parkerlacy.com works
resource "aws_acm_certificate" "cert" {
  count             = local.custom_domain ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
  # Changing SANs replaces the cert. create_before_destroy below makes that
  # safe: the new cert is issued, validated and attached to the distribution
  # before the old one is deleted.
  subject_alternative_names = ["www.${var.domain_name}"]

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.custom_domain ? {
    for dvo in aws_acm_certificate.cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = aws_route53_zone.zone[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_route53_record" "site" {
  for_each = local.custom_domain ? toset(["A", "AAAA"]) : toset([])
  zone_id  = aws_route53_zone.zone[0].zone_id
  name     = var.domain_name
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.distribution.domain_name
    zone_id                = aws_cloudfront_distribution.distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# www.<domain> points at the same distribution, which redirects it to the apex.
resource "aws_route53_record" "www" {
  for_each = local.custom_domain ? toset(["A", "AAAA"]) : toset([])
  zone_id  = aws_route53_zone.zone[0].zone_id
  name     = "www.${var.domain_name}"
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.distribution.domain_name
    zone_id                = aws_cloudfront_distribution.distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# DNS trust records (GH #169 finding #4). The domain sends no mail, so SPF and
# DMARC say "reject everything" and DMARC publishes no report address. DNSSEC
# is deliberately not here: it needs a manual DS record at the registrar.

# Only Amazon may issue certs for the domain (and www, which inherits the apex
# record). These are the four issuer domains AWS documents for ACM; listing all
# of them means a renewal can't be blocked by ACM picking a different one.
resource "aws_route53_record" "caa" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone[0].zone_id
  name    = var.domain_name
  type    = "CAA"
  ttl     = 3600
  records = [
    "0 issue \"amazon.com\"",
    "0 issue \"amazontrust.com\"",
    "0 issue \"awstrust.com\"",
    "0 issue \"amazonaws.com\"",
  ]
}

resource "aws_route53_record" "spf" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone[0].zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 -all"]
}

resource "aws_route53_record" "dmarc" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone[0].zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 3600
  records = ["v=DMARC1; p=reject"]
}

resource "aws_acm_certificate_validation" "cert" {
  count                   = local.custom_domain ? 1 : 0
  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}