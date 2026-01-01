#!/bin/bash

echo "🚀 Setting up KSMART HOUSE for Git deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📁 Adding all files to Git..."
git add .

# Commit
echo "💾 Creating initial commit..."
git commit -m "KSMART HOUSE: Complete Business Management System

Features:
- Customer Management
- Gym Management & Finances
- Restaurant Sales Tracking
- Sauna & Spa Bookings
- Event Management
- Real-time Dashboard
- Supabase Integration
- Next.js 15 with TypeScript"

echo ""
echo "✅ Git repository ready!"
echo ""
echo "🔗 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Copy the repository URL"
echo "3. Run: git remote add origin YOUR_REPO_URL"
echo "4. Run: git push -u origin main"
echo "5. Deploy with: vercel --prod"
echo ""
echo "📋 Repository suggestions:"
echo "   Name: ksmart-house-business"
echo "   Description: KSMART HOUSE - Complete Business Management System"