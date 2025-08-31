# https://pfertyk.me/2023/01/creating-a-static-website-with-terraform-and-aws/

resource "aws_s3_bucket" "bucket" {
  bucket = local.bucket_name
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "bucket_access_block" {
  bucket = aws_s3_bucket.bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
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
  for_each = fileset(path.module, "../frontend/dist/**/*.{html,css,js,jpeg,jpg,png,webp,svg,gif,ico}")
  bucket   = aws_s3_bucket.bucket.id
  key      = replace(each.value, "/^..\/frontend\/dist\//", "")
  source   = each.value
  content_type = lookup(local.content_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
  source_hash  = filemd5(each.value)

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

# CloudFront distribution - optional for cost savings
resource "aws_cloudfront_distribution" "distribution" {
  count = var.enable_cloudfront ? 1 : 0

  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.environment} - ${var.domain_name}"

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

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  default_cache_behavior {
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.bucket.bucket_regional_domain_name
  }

  tags = local.common_tags
}

# Route 53 hosted zone - only create if it's production environment
resource "aws_route53_zone" "zone" {
  count = var.environment == "prod" ? 1 : 0
  name  = var.domain_name
  tags  = local.common_tags
}