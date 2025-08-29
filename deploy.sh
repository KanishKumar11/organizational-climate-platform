#!/bin/bash

# Deployment script for Coolify
# This script prepares the application for deployment

set -e

echo "🚀 Starting deployment preparation..."

# Check if required environment variables are set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI environment variable is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ Error: NEXTAUTH_SECRET environment variable is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ Error: NEXTAUTH_URL environment variable is not set"
    exit 1
fi

echo "✅ Environment variables check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building the application..."
npm run build

echo "✅ Build completed successfully"

# Run database migrations/seeding if needed
echo "🗄️ Checking database setup..."
# Add any database setup commands here if needed

# Health check
echo "🏥 Running health checks..."
# Add any health check commands here

echo "🎉 Deployment preparation completed successfully!"
echo "📋 Next steps:"
echo "   1. Ensure all environment variables are properly configured in Coolify"
echo "   2. Set up MongoDB connection"
echo "   3. Configure domain and SSL"
echo "   4. Monitor application logs after deployment"