#!/bin/bash

# Development setup script
set -e

echo "🚀 Setting up development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from .env.example..."
    cp .env.example .env.local
fi

# Build and start development environment
echo "🔧 Building development environment..."
docker-compose up --build -d

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Application is running at: http://localhost:5173"
echo ""
echo "Useful commands:"
echo "  📊 View logs:     docker-compose logs -f"
echo "  🛑 Stop:          docker-compose down"
echo "  🔄 Restart:       docker-compose restart"
echo "  🧹 Clean:         docker-compose down -v --rmi all"
echo ""