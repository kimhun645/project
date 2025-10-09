#!/bin/bash

# Deploy Email Service to Cloud Run
# Project: stock-6e930

echo "🚀 Starting email service deployment..."

# Set project
gcloud config set project stock-6e930

# Build and deploy using Cloud Build
echo "📦 Building email service..."
gcloud builds submit --tag gcr.io/stock-6e930/stock-scribe-email:latest .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy stock-scribe-email \
    --image gcr.io/stock-6e930/stock-scribe-email:latest \
    --region asia-southeast1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production,PORT=8080

echo "✅ Email service deployed successfully!"
echo "📧 Email endpoint: https://stock-scribe-email-[hash]-uc.a.run.app/api/send-email"
