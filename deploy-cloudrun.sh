#!/bin/bash

echo "🚀 Deploying to Cloud Run..."
echo

echo "📋 Step 1: Build the application"
npm run build

echo
echo "📋 Step 2: Deploy to Cloud Run"
gcloud run deploy stock-scribe-backend --source . --platform managed --region asia-southeast1 --allow-unauthenticated --port 8080

echo
echo "✅ Deployment completed!"
echo "🌐 API URL: https://stock-scribe-backend-601202807478.asia-southeast1.run.app/api"
