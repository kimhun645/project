# การแก้ไขปัญหาการแก้ไขข้อมูลผู้ใช้

## ปัญหาที่พบ
1. ฟังก์ชัน `handleSave` ใน Profile.tsx ไม่ได้เรียกใช้ FirestoreService จริง
2. การ import FirestoreService ใน UserManagement.tsx ไม่ถูกต้อง
3. ข้อผิดพลาดใน AlertDialog ที่ใช้ `user.name` แทน `user.displayName`
4. ขาด method `updateUser` และ `addUser` ใน FirestoreService

## การแก้ไขที่ทำ

### 1. แก้ไข Profile.tsx
- เปลี่ยน `handleSave` ให้เป็น async function
- เพิ่มการเรียกใช้ `FirestoreService.updateUser`
- เพิ่ม error handling ที่เหมาะสม

### 2. แก้ไข UserManagement.tsx
- แก้ไขการ import FirestoreService
- ปรับปรุง `handleAddUser` และ `handleEditUser`
- แก้ไข AlertDialog ให้ใช้ `user.displayName`

### 3. เพิ่ม methods ใน FirestoreService
- เพิ่ม `updateUser(userId, userData)` method
- เพิ่ม `addUser(userData)` method
- ปรับปรุง error handling

## วิธีการทดสอบ
1. เข้าหน้า Profile และลองแก้ไขข้อมูล
2. เข้าหน้า User Management และลองเพิ่ม/แก้ไขผู้ใช้
3. ตรวจสอบว่าข้อมูลถูกบันทึกลง Firestore

## ไฟล์ที่แก้ไข
- `src/pages/Profile.tsx`
- `src/components/UserManagement.tsx` 
- `src/lib/firestoreService.ts`

## สถานะ
✅ แก้ไขเสร็จสิ้น - การแก้ไขข้อมูลผู้ใช้ควรทำงานได้ปกติแล้ว
