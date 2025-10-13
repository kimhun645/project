# 🔧 การแก้ไขปัญหา Deploy

## ❌ ปัญหาที่พบ
Cloud Run build ล้มเหลวเนื่องจาก Vite build มีปัญหา

## ✅ วิธีแก้ไข

### วิธีที่ 1: ใช้ Firebase Functions (แนะนำ)
```bash
# 1. Login Firebase
firebase login --reauth

# 2. Deploy Functions
firebase deploy --only functions
```

### วิธีที่ 2: ใช้ Cloud Run แบบง่าย
```bash
# 1. Build locally
npm run build

# 2. Deploy แบบง่าย
gcloud run deploy stock-scribe-backend --image gcr.io/stocknrs/stock-scribe-backend --platform managed --region asia-southeast1 --allow-unauthenticated --port 8080
```

### วิธีที่ 3: ใช้ Firebase Hosting + Cloud Functions
```bash
# 1. Deploy hosting
firebase deploy --only hosting

# 2. Deploy functions
firebase deploy --only functions
```

## 🚀 ขั้นตอนที่แนะนำ

### 1. ใช้ Firebase Functions
- ไม่ต้อง build frontend
- ใช้ Firebase hosting สำหรับ frontend
- ใช้ Firebase Functions สำหรับ API

### 2. Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

### 3. Deploy API
```bash
firebase deploy --only functions
```

## 📝 หมายเหตุ
- Firebase Functions มี free tier
- ไม่ต้องจัดการ Docker
- Deploy ง่ายกว่า Cloud Run
