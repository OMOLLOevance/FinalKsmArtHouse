#!/bin/bash

echo "🚀 Deploying KSMART HOUSE to Vercel..."
echo "I'll handle all the prompts for you!"

# Deploy with automatic answers
echo "Y" | vercel --name ksmart-house --prod

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your KSMART HOUSE is now live at:"
echo "   https://ksmart-house.vercel.app"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on 'ksmart-house' project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add your Supabase credentials"
echo "5. Redeploy once after adding environment variables"
echo ""
echo "🎉 Your business management system is ready!"