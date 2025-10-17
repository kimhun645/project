# แก้ไขปัญหาการบันทึกการตั้งค่าในหน้าตั้งค่า Tab ทั่วไป

## ปัญหาที่พบ
- หน้าตั้งค่า tab ทั่วไปไม่สามารถบันทึกการตั้งค่าได้
- ข้อมูลไม่ถูกบันทึกลงฐานข้อมูล Firestore

## การแก้ไขที่ทำ

### 1. แก้ไขฟังก์ชัน `handleSaveSettings`
- เพิ่มการบันทึกลง Firestore ผ่าน `FirestoreService.saveSettings()`
- เก็บ localStorage เป็น backup
- เพิ่ม error handling ที่ดีขึ้น

### 2. แก้ไขฟังก์ชัน `loadSettings`
- โหลดข้อมูลจาก Firestore เป็นหลัก
- ใช้ localStorage เป็น fallback
- แปลงข้อมูลจาก Firestore format เป็น form format

### 3. แก้ไข import path
- เปลี่ยนจาก `@/lib/FirestoreService` เป็น `@/lib/firestoreService`

## วิธีการทดสอบ

### ทดสอบด้วยตนเอง:
1. เข้าไปที่ `https://stock-6e930.web.app`
2. เข้าสู่ระบบด้วยบัญชี admin
3. ไปที่หน้า Settings
4. คลิกที่ tab "ทั่วไป"
5. กรอกข้อมูลในฟอร์ม:
   - ชื่อบริษัท: บริษัททดสอบ จำกัด
   - อีเมล: test@company.com
   - เบอร์โทรศัพท์: 02-123-4567
   - ที่อยู่: 123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110
6. คลิกปุ่ม "บันทึกการตั้งค่า"
7. ตรวจสอบว่ามีข้อความ "บันทึกสำเร็จ"
8. รีเฟรชหน้าเว็บ
9. ตรวจสอบว่าข้อมูลยังคงอยู่

### ทดสอบด้วยสคริปต์:
```bash
node test-settings-save.js
```

## ไฟล์ที่แก้ไข
- `src/pages/Settings.tsx` - แก้ไขฟังก์ชัน handleSaveSettings และ loadSettings

## ฟีเจอร์ที่ทำงาน
- ✅ บันทึกข้อมูลลง Firestore
- ✅ โหลดข้อมูลจาก Firestore
- ✅ Fallback ไป localStorage
- ✅ Error handling
- ✅ Loading states
- ✅ Success/Error notifications

## การตรวจสอบเพิ่มเติม
หากยังมีปัญหา ให้ตรวจสอบ:
1. Firebase configuration ถูกต้อง
2. Firestore rules อนุญาตการเขียนข้อมูล
3. Network connection ทำงานปกติ
4. Browser console สำหรับ error messages
