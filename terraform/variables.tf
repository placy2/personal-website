# Variables for infrastructure configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "parkerlacy.com"
}

variable "bucket_name" {
  description = "S3 bucket name for hosting"
  type        = string
  default     = ""
}

variable "enable_cloudfront" {
  description = "Whether to enable CloudFront distribution (disable for cost savings in dev)"
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "personal-website"
    ManagedBy   = "terraform"
  }
}

# Derived locals
locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.domain_name}-${var.environment}-hosting"
  
  common_tags = merge(var.tags, {
    Environment = var.environment
  })
  
  content_types = {
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "text/javascript"
    ".jpeg" = "image/jpeg"
    ".jpg"  = "image/jpeg"
    ".png"  = "image/png"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".json" = "application/json"
    ".txt"  = "text/plain"
  }
}