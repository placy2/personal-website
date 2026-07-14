#!/bin/bash

# Quick teardown script for cost management
set -e

ENVIRONMENT=${1:-dev}

echo "🗑️  Tearing down ${ENVIRONMENT} environment..."

# Ensure we're in the terraform directory
cd "$(dirname "$0")/../terraform"

# Re-initialize so the backend key matches the environment being destroyed
terraform init -reconfigure -backend-config="env/${ENVIRONMENT}.s3.tfbackend"

# Destroy infrastructure
terraform destroy -var-file="env/${ENVIRONMENT}.tfvars" -auto-approve

echo "✅ ${ENVIRONMENT} environment has been torn down!"
echo "💰 This should help save on cloud costs."