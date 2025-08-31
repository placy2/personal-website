#!/bin/bash

# Quick development deployment script
set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

echo "🚀 Terraform ${ACTION} for ${ENVIRONMENT} environment..."

# Ensure we're in the terraform directory
cd "$(dirname "$0")/../terraform"

# Initialize terraform if needed
if [ ! -d ".terraform" ]; then
    echo "📋 Initializing Terraform..."
    terraform init
fi

# Check if frontend build exists
if [ ! -d "../frontend/dist" ]; then
    echo "⚠️  Frontend build not found. Building frontend..."
    cd ../frontend
    npm run build
    cd ../terraform
fi

case $ACTION in
    "plan")
        echo "📊 Running terraform plan..."
        terraform plan -var-file="${ENVIRONMENT}.tfvars"
        ;;
    "apply")
        echo "🔧 Running terraform apply..."
        terraform apply -var-file="${ENVIRONMENT}.tfvars" -auto-approve
        echo "✅ Deployment complete!"
        terraform output
        ;;
    "destroy")
        echo "🗑️  Running terraform destroy..."
        terraform destroy -var-file="${ENVIRONMENT}.tfvars" -auto-approve
        echo "✅ Infrastructure destroyed!"
        ;;
    *)
        echo "❌ Invalid action. Use: plan, apply, or destroy"
        exit 1
        ;;
esac