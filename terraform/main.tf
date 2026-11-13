# https://pfertyk.me/2023/01/creating-a-static-website-with-terraform-and-aws/

resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket_name
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  bucket = aws_s3_bucket.bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "bucket_access_block" {
  bucket = aws_s3_bucket.bucket.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  depends_on = [aws_s3_bucket_public_access_block.bucket_access_block]
  bucket     = aws_s3_bucket.bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Sid" : "PublicReadGetObject",
        "Effect" : "Allow",
        "Principal" : "*",
        "Action" : "s3:GetObject",
        "Resource" : "arn:aws:s3:::${aws_s3_bucket.bucket.id}/*"
      }
    ]
  })
}

resource "aws_s3_object" "file" {
  for_each     = fileset(path.module, "../frontend/dist/**/*.{html,css,js,txt,xml,jpeg,jpg,png,webp,svg,gif,ico}")
  bucket       = aws_s3_bucket.bucket.id
  key          = replace(each.value, "/^../frontend/dist//", "")
  source       = each.value
  content_type = lookup(local.content_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
  source_hash  = filemd5(each.value)

  cache_control = endswith(each.value, ".html") ? "no-cache" : (
    strcontains(each.value, "/assets/") ? "public, max-age=31536000, immutable"
    : "public, max-age=86400"
  )
  tags = local.common_tags
}

resource "aws_s3_bucket_website_configuration" "hosting" {
  bucket = aws_s3_bucket.bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Replaces the AWS managed SecurityHeadersPolicy. Keeps its nosniff,
# X-Frame-Options and Referrer-Policy values, adds a CSP and Permissions-Policy,
# adds includeSubDomains to HSTS, and drops the deprecated X-XSS-Protection.
#
# The CSP assumes the build is same-origin only: Vite emits external module
# scripts and stylesheets, and the only inline <script> blocks are
# type="application/ld+json" (data, not executed). Adding a third-party script,
# font, image or analytics beacon means updating this policy, or the browser
# will block it in prod only (dev is S3-only and never gets these headers).
# HSTS preload is deliberately off: preload-list removal is slow and manual.
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  count   = var.enable_cloudfront ? 1 : 0
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

# Rewrites /about -> /about/index.html so direct loads get each route's own
# prerendered page instead of the home page. See functions/rewrite-index.js.
resource "aws_cloudfront_function" "rewrite_index" {
  count   = var.enable_cloudfront ? 1 : 0
  name    = "${var.environment}-personal-website-rewrite-index"
  runtime = "cloudfront-js-2.0"
  comment = "Map extensionless routes to their prerendered index.html"
  publish = true
  code    = file("${path.module}/functions/rewrite-index.js")
}

# CloudFront distribution - optional for cost savings
resource "aws_cloudfront_distribution" "distribution" {
  count = var.enable_cloudfront ? 1 : 0

  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.environment} - ${var.domain_name}"

  # No custom_error_response: unknown paths keep S3's real 404 status. The
  # website endpoint's error_document (index.html) is the body, and the app's
  # catch-all route renders "Page not found" client-side. A 404->200 remap here
  # would tell crawlers every typo'd URL is a duplicate of the home page.

  origin {
    domain_name = aws_s3_bucket_website_configuration.hosting.website_endpoint
    origin_id   = aws_s3_bucket.bucket.bucket_regional_domain_name

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols = [
        "TLSv1.2",
      ]
    }
  }

  aliases = [var.domain_name]

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert[0].certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
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
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers[0].id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rewrite_index[0].arn
    }
  }

  price_class = "PriceClass_100"

  tags = local.common_tags
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
  count             = var.enable_cloudfront ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
  # Add if www is needed later: subject_alternative_names = ["www.${var.domain_name}"]

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.enable_cloudfront ? {
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
  for_each = var.enable_cloudfront ? toset(["A", "AAAA"]) : toset([])
  zone_id  = aws_route53_zone.zone[0].zone_id
  name     = var.domain_name
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.distribution[0].domain_name
    zone_id                = aws_cloudfront_distribution.distribution[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_acm_certificate_validation" "cert" {
  count                   = var.enable_cloudfront ? 1 : 0
  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}