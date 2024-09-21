terraform {
  required_version = ">= 1.2.9"
  backend "s3" {
    bucket = "parker-terraform-backends"
    key    = "terraform/personal-website/state"
    region = "us-east-1"
  } 
}

provider "aws" {
  region = "us-east-1"
}
