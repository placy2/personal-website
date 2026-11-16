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
}

variable "allow_public_read" {
  description = "Cutover phase 1 only: keep the legacy public-read bucket policy and S3 website endpoint alongside the CloudFront OAC grant"
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
    Project   = "personal-website"
    ManagedBy = "terraform"
  }
}