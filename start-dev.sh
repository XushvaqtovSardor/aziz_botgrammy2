#!/bin/bash

# Quick start script for development

echo "🚀 Starting Aziz Bot in development mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual credentials!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate dev

# Start development server
echo "▶️  Starting development server..."
pnpm start:dev
