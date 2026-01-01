#!/bin/bash

# KSM.ART HOUSE - Vercel Deployment Script

echo "🚀 Deploying KSM.ART HOUSE to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app is now live on Vercel!"