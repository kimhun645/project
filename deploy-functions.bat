@echo off
echo 🔥 Deploying Firebase Functions...
echo.

echo 📋 Step 1: Login to Firebase
firebase login --reauth

echo.
echo 📋 Step 2: Deploy Functions
firebase deploy --only functions

echo.
echo ✅ Deployment completed!
pause
