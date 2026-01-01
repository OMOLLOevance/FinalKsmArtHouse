# 🚀 KSMART HOUSE - Git Repository Deployment

## Step 1: Create New Git Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository Name**: `ksmart-house-business`
3. **Description**: `KSMART HOUSE - Complete Business Management System`
4. **Visibility**: Public or Private (your choice)
5. **Click**: "Create repository"

## Step 2: Initialize Git in Your Project

```bash
# Navigate to your project
cd /home/that/Desktop/omolloworks/FinalKsmArtHouse/ksm-art-house-nextjs

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: KSMART HOUSE Business Management System"

# Add your new repository as origin
git remote add origin https://github.com/YOUR_USERNAME/ksmart-house-business.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy from Git Repository

```bash
# Deploy using Vercel with Git integration
vercel --prod
```

When prompted:
- **Link to existing project?**: N (No)
- **Project name**: `ksmart-house-business`
- **Directory**: Press Enter (current directory)
- **Override settings?**: N (No)

## Step 4: Add Environment Variables

After deployment, add these in Vercel Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://mqnfdmdqfysqxxamgvwc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_NAME=KSMART HOUSE
```

## Your New URLs:
- **GitHub**: https://github.com/YOUR_USERNAME/ksmart-house-business
- **Live App**: https://ksmart-house-business.vercel.app

## Benefits of Git Deployment:
✅ Automatic deployments on every push
✅ Easy rollbacks to previous versions
✅ Collaboration with team members
✅ Version control for all changes