terraform {
  required_version = ">= 1.13.5"
  # Partial backend config: `key` is intentionally omitted so dev and prod
  # keep separate state. Pass the environment's backend file at init time:
  #   terraform init -backend-config=env/dev.s3.tfbackend
  backend "s3" {
    bucket = "parker-terraform-backends"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}
