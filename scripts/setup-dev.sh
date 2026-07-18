#!/bin/bash

set -e

echo "🚀 Setting up Contract AI Platform development environment..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✓ pnpm $(pnpm -v)"

# Check Python for AI services
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python 3.11+ is required for AI services"
    echo "   Install from: https://www.python.org/downloads/"
else
    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    echo "✓ Python $PYTHON_VERSION"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is recommended for running services"
    echo "   Install from: https://www.docker.com/products/docker-desktop"
else
    echo "✓ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
fi

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Setup pre-commit hooks
if [ -d .git ]; then
    echo "🔧 Setting up Git hooks..."
    if [ -f package.json ]; then
        pnpm exec husky install || true
    fi
fi

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env.local with your configuration"
echo "  2. Start infrastructure: pnpm docker:up"
echo "  3. Run migrations: pnpm db:migrate"
echo "  4. Start development: pnpm dev"
echo ""
