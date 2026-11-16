output "website_url" {
  description = "Website hostname (the CloudFront domain)"
  value       = aws_cloudfront_distribution.distribution.domain_name
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.distribution.domain_name}"
}

output "s3_direct_url" {
  description = "Direct (non-CloudFront) S3 REST URL for the bucket"
  value       = "https://${aws_s3_bucket.bucket.bucket_regional_domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.bucket.bucket
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "nameservers" {
  description = "Route53 zone nameservers for the domain"
  value       = var.environment == "prod" ? aws_route53_zone.zone[0].name_servers : null
}

output "cloudfront_distribution_id" {
  description = "Distribution ID needed for cache invalidation in GH workflow"
  value       = aws_cloudfront_distribution.distribution.id
}
