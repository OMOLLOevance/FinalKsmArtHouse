#!/bin/bash

# KSM Art House - Vercel Deployment Script
# Deploy to https://ksmart-house.vercel.app/

echo "🚀 Starting KSM Art House deployment to Vercel..."

# Navigate to project directory
cd /home/that/Desktop/omolloworks/FinalKsmArtHouse/ksm-art-house-nextjs

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

# Deploy to production
echo "🌐 Deploying to production..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Your app is live at: https://ksmart-house.vercel.app/"
    echo "📊 Dashboard: https://vercel.com/dashboard"
else
    echo "❌ Deployment failed!"
    exit 1
fi