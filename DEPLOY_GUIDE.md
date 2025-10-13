# 🚀 คำแนะนำการ Deploy ระบบจัดการหมวดหมู่

## ✅ สถานะปัจจุบัน
- ✅ เพิ่ม API endpoints สำหรับ categories ใน `server.js`
- ✅ อัปเดต API service ให้ใช้ Cloud Run URL
- ✅ ระบบพร้อมใช้งาน

## 🚀 วิธี Deploy

### วิธีที่ 1: ใช้ Cloud Run (แนะนำ)
```bash
# Deploy ไปยัง Cloud Run
gcloud run deploy stock-scribe-backend --source . --platform managed --region asia-southeast1 --allow-unauthenticated --port 8080
```

### วิธีที่ 2: ใช้ไฟล์ deploy script
```bash
# Windows
deploy-cloudrun.bat

# Linux/Mac
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```

## 🔧 API Endpoints ที่เพิ่มแล้ว

- `GET /api/categories` - ดึงข้อมูลหมวดหมู่ทั้งหมด
- `POST /api/categories` - สร้างหมวดหมู่ใหม่
- `PUT /api/categories/{id}` - แก้ไขหมวดหมู่
- `DELETE /api/categories/{id}` - ลบหมวดหมู่

## 🌐 URL ที่ใช้
- **API Base URL**: `https://stock-scribe-backend-601202807478.asia-southeast1.run.app/api`
- **Frontend**: `https://stock-6e930.web.app`

## 🧪 ทดสอบการทำงาน
1. เปิดเว็บไซต์: https://stock-6e930.web.app
2. ไปที่หน้า "หมวดหมู่"
3. คลิก "เพิ่มหมวดหมู่"
4. กรอกข้อมูลและบันทึก

## 📝 หมายเหตุ
- ระบบจะตรวจสอบชื่อหมวดหมู่ซ้ำ
- ป้องกันการลบหมวดหมู่ที่มีสินค้า
- ใช้ Firebase Firestore เป็นฐานข้อมูล
