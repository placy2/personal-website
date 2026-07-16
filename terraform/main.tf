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
  for_each     = fileset(path.module, "../frontend/dist/**/*.{html,css,js,jpeg,jpg,png,webp,svg,gif,ico}")
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

data "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "Managed-SecurityHeadersPolicy"
}

# CloudFront distribution - optional for cost savings
resource "aws_cloudfront_distribution" "distribution" {
  count = var.enable_cloudfront ? 1 : 0

  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.environment} - ${var.domain_name}"

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 60
  }

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
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
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