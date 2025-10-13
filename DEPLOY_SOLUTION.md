# 🔧 วิธีแก้ไขปัญหา Firebase Functions

## ❌ ปัญหาที่พบ
Firebase project `stock-6e930` ต้องใช้ **Blaze plan** (pay-as-you-go) เพื่อใช้ Cloud Functions

## ✅ วิธีแก้ไข 2 ทางเลือก

### ทางเลือกที่ 1: อัปเกรดเป็น Blaze Plan (แนะนำ)
1. ไปที่: https://console.cloud.google.com/billing/linkedaccount?project=stock-6e930
2. อัปเกรดเป็น Blaze plan
3. Deploy functions: `firebase deploy --only functions`

### ทางเลือกที่ 2: ใช้ Firebase Hosting + Cloud Run (ไม่ต้องอัปเกรด)
1. ใช้ server.js ที่มีอยู่แล้ว
2. Deploy ไปยัง Cloud Run
3. อัปเดต API URL ใน frontend

## 🚀 วิธีแก้ไขแบบไม่ต้องอัปเกรด

### ขั้นตอนที่ 1: ใช้ server.js ที่มีอยู่
```bash
# เริ่ม server
node server.js
```

### ขั้นตอนที่ 2: Deploy ไปยัง Cloud Run
```bash
# Build และ deploy
gcloud run deploy stock-scribe-backend --source . --platform managed --region asia-southeast1 --allow-unauthenticated
```

### ขั้นตอนที่ 3: อัปเดต API URL
แก้ไข `src/lib/apiService.ts`:
```typescript
const getApiBaseUrl = () => {
  return 'https://stock-scribe-backend-601202807478.asia-southeast1.run.app/api';
};
```

## 📝 หมายเหตุ
- Blaze plan มี free tier สำหรับ Cloud Functions
- Cloud Run มี free tier เช่นกัน
- ระบบจะทำงานได้เหมือนเดิม
