locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
  })

  # Only prod has the custom domain (Route 53 zone, ACM cert, aliases). Dev's
  # distribution answers on its *.cloudfront.net name with the default cert.
  custom_domain = var.environment == "prod"

  # Object content types and cache-control headers are set by
  # scripts/upload-site.sh, not Terraform. Keep that script's type map in sync
  # if a new file extension starts shipping in frontend/dist.
}
