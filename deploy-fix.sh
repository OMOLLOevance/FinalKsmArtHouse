#!/bin/bash

echo "🚀 KSM.ART HOUSE - DEPLOYMENT & FIX SCRIPT"
echo "=========================================="

# 1. Clean and rebuild
echo "🧹 Cleaning build cache..."
rm -rf .next node_modules/.cache

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# 3. Build application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# 4. Test database connection
echo "🔍 Testing database connection..."
node test-db-connection.js

# 5. Run comprehensive test
echo "🧪 Running comprehensive system test..."
node comprehensive-test.js

# 6. Deploy to Vercel (if requested)
if [ "$1" = "--deploy" ]; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod --yes
fi

echo "=========================================="
echo "✅ DEPLOYMENT SCRIPT COMPLETED"
echo "=========================================="