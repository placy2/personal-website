output "website_url" {
  description = "Website URL (HTTPS)"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.distribution[0].domain_name : null
}

output "cloudfront_url" {
  description = "CloudFront distribution URL (if enabled)"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.distribution[0].domain_name}" : null
}

output "s3_url" {
  description = "S3 hosting URL (HTTP)"
  value       = "http://${aws_s3_bucket_website_configuration.hosting.website_endpoint}"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.bucket.bucket
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}