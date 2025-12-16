terraform {
  required_version = ">= 1.13.5"
  backend "s3" {}
}

provider "aws" {
  region = "us-east-1"
}
