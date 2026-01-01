# 🚀 KSM.ART HOUSE - Vercel Deployment Guide

## Quick Deploy (3 Steps)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
./deploy.sh
```

## Manual Deployment

### 1. Prepare Environment Variables
In Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_NAME=KSM.ART HOUSE
NEXT_PUBLIC_APP_DESCRIPTION=Complete business management system
NEXT_PUBLIC_API_URL=
```

### 2. Deploy Commands
```bash
# Clean and install
rm -rf .next
npm install

# Deploy to production
vercel --prod
```

## Database Setup (Required)

1. Go to your Supabase SQL Editor
2. Run the `REPAIR_DATABASE.sql` file
3. Verify all tables are created

## Post-Deployment Checklist

- ✅ Database tables created
- ✅ Environment variables set
- ✅ App builds successfully
- ✅ Authentication works
- ✅ API routes respond

## Troubleshooting

**Build Errors**: Clear `.next` folder and reinstall dependencies
**API Errors**: Check Supabase environment variables
**Auth Issues**: Verify Supabase auth configuration

## Live URL
After deployment, your app will be available at:
`https://your-project-name.vercel.app`