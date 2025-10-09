# 📧 Deploy Email Service to Cloud Run

## 🎯 Project: stock-6e930

### 📋 Prerequisites
- Google Cloud CLI installed
- Docker installed
- Authenticated with gcloud

### 🚀 Manual Deployment Steps

#### 1. **Set Project**
```bash
gcloud config set project stock-6e930
```

#### 2. **Build Docker Image**
```bash
# Build the image
docker build -t gcr.io/stock-6e930/stock-scribe-email:latest -f Dockerfile.email .

# Push to Container Registry
docker push gcr.io/stock-6e930/stock-scribe-email:latest
```

#### 3. **Deploy to Cloud Run**
```bash
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
```

#### 4. **Alternative: Use Cloud Build**
```bash
# Submit build
gcloud builds submit --tag gcr.io/stock-6e930/stock-scribe-email:latest .

# Deploy to Cloud Run
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
```

### 📧 Email Service Configuration

#### **SMTP Settings:**
- **Host:** smtp.gmail.com
- **Port:** 587
- **User:** koratnrs@rockchatn.com
- **Password:** viumcgrcmboowrsu (App Password)

#### **Endpoints:**
- **Email:** `POST /api/send-email`
- **Health:** `GET /api/health`

### 🔧 Files Required:
- `Dockerfile.email` - Docker configuration
- `server-email-cloudrun.js` - Email service
- `package-email.json` - Dependencies

### ✅ Expected Result:
- Email service running on Cloud Run
- URL: `https://stock-scribe-email-[hash]-uc.a.run.app`
- Health check: `https://stock-scribe-email-[hash]-uc.a.run.app/api/health`
- Email endpoint: `https://stock-scribe-email-[hash]-uc.a.run.app/api/send-email`

### 🧪 Testing:
```bash
# Health check
curl https://stock-scribe-email-[hash]-uc.a.run.app/api/health

# Test email
curl -X POST https://stock-scribe-email-[hash]-uc.a.run.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1>"
  }'
```
