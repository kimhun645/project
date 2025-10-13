# 🚀 คำแนะนำการ Deploy Firebase Functions

## ขั้นตอนการ Deploy

### 1. Login Firebase CLI
```bash
firebase login --reauth
```

### 2. Deploy Functions
```bash
firebase deploy --only functions
```

### 3. ตรวจสอบการทำงาน
- เปิดเว็บไซต์: https://stock-6e930.web.app
- ไปที่หน้า "หมวดหมู่"
- ลองเพิ่มหมวดหมู่ใหม่

## 🔧 API Endpoints ที่เพิ่มแล้ว

- `GET /categories` - ดึงข้อมูลหมวดหมู่ทั้งหมด
- `POST /categories` - สร้างหมวดหมู่ใหม่
- `PUT /categoryById/{id}` - แก้ไขหมวดหมู่
- `DELETE /categoryById/{id}` - ลบหมวดหมู่

## 📝 หมายเหตุ

- ระบบจะใช้ Firebase Functions แทน Cloud Run
- API endpoints จะอยู่ที่: `https://asia-southeast1-stock-6e930.cloudfunctions.net`
- ระบบจะตรวจสอบชื่อหมวดหมู่ซ้ำและป้องกันการลบหมวดหมู่ที่มีสินค้า

## 🐛 หากมีปัญหา

1. ตรวจสอบ Firebase project ID: `stock-6e930`
2. ตรวจสอบว่า Firebase CLI login แล้ว
3. ตรวจสอบว่า functions deploy สำเร็จ
4. ดู logs ใน Firebase Console
