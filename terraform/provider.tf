terraform {
  required_version = ">= 1.10.5"
  backend "s3" {
    bucket = "parker-terraform-backends"
    key    = "terraform/personal-website/state"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}
