# 🧪 Production Testing Instructions

## การทดสอบระบบโปรดักชัน - คู่มือการใช้งาน

### 📋 **ขั้นตอนการทดสอบ**

#### **1. เปิดเว็บไซต์โปรดักชัน**
```
URL: https://stock-6e930.web.app
```

#### **2. เปิด Developer Console**
- กด `F12` หรือ `Ctrl+Shift+I`
- ไปที่ tab "Console"

#### **3. โหลด Test Scripts**
```javascript
// โหลด test scripts
const script1 = document.createElement('script');
script1.src = 'https://raw.githubusercontent.com/your-repo/test-stock-transaction.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://raw.githubusercontent.com/your-repo/test-real-time-features.js';
document.head.appendChild(script2);

const script3 = document.createElement('script');
script3.src = 'https://raw.githubusercontent.com/your-repo/test-data-integrity.js';
document.head.appendChild(script3);

const script4 = document.createElement('script');
script4.src = 'https://raw.githubusercontent.com/your-repo/comprehensive-test-suite.js';
document.head.appendChild(script4);

const script5 = document.createElement('script');
script5.src = 'https://raw.githubusercontent.com/your-repo/automated-test-runner.js';
document.head.appendChild(script5);

const script6 = document.createElement('script');
script6.src = 'https://raw.githubusercontent.com/your-repo/production-validation.js';
document.head.appendChild(script6);
```

#### **4. รันการทดสอบ**

##### **A. ทดสอบ Stock Transaction**
```javascript
// ทดสอบการอัปเดตสต็อก
testStockTransaction().then(result => {
  console.log('Stock Transaction Test Results:', result);
});
```

##### **B. ทดสอบ Real-time Features**
```javascript
// ทดสอบ real-time และ keyboard shortcuts
testRealTimeFeatures();
```

##### **C. ทดสอบ Data Integrity**
```javascript
// ทดสอบความถูกต้องของข้อมูล
testDataIntegrity();
```

##### **D. รัน Comprehensive Test Suite**
```javascript
// รัน test suite ครบถ้วน
const testSuite = new ProductionTestSuite();
testSuite.runAllTests();
```

##### **E. รัน Automated Test Runner**
```javascript
// รัน automated testing
const testRunner = new AutomatedTestRunner();
testRunner.runAllTests();
```

##### **F. รัน Production Validation**
```javascript
// ตรวจสอบระบบโปรดักชัน
const validator = new ProductionValidator();
validator.validateSystem();
```

### 🎯 **Test Scenarios ที่ต้องทดสอบ**

#### **Scenario 1: Stock Transaction Flow**
1. เพิ่มสินค้าใหม่ (สต็อกเริ่มต้น = 100)
2. เบิกพัสดุ 30 ชิ้น (ควรเหลือ = 70)
3. รับพัสดุ 20 ชิ้น (ควรเป็น = 90)
4. ลบการเบิก (ควรคืนเป็น = 120)
5. ลบการรับ (ควรคืนเป็น = 70)

#### **Scenario 2: Real-time Updates**
1. เปิด 2 browser tabs
2. ทำการเปลี่ยนแปลงใน tab 1
3. ตรวจสอบ tab 2 อัปเดตทันที

#### **Scenario 3: Keyboard Shortcuts**
1. กด `Ctrl+W` เปิด Withdrawal Dialog
2. กด `Ctrl+R` เปิด Receipt Dialog
3. กด `F5` รีเฟรชข้อมูล

#### **Scenario 4: Error Handling**
1. เบิกพัสดุเกินสต็อกที่มี
2. ลบสินค้าที่มีการเคลื่อนไหว
3. ทดสอบ network interruption

### 📊 **ผลลัพธ์ที่คาดหวัง**

#### **✅ Stock Accuracy**
- สต็อกต้องถูกต้องทุกครั้ง
- การอัปเดตสต็อกต้องเป็น atomic
- ไม่มี race conditions

#### **✅ Real-time Sync**
- ข้อมูลอัปเดตทันทีทุก client
- การเปลี่ยนแปลงแสดงผลทันที
- ไม่มีข้อมูลล่าช้า

#### **✅ Data Integrity**
- ไม่มีข้อมูลสูญหาย
- การลบ movement คืนสต็อกถูกต้อง
- Transaction rollback ทำงานได้

#### **✅ User Experience**
- ใช้งานง่ายและมี feedback ที่ชัดเจน
- Loading states และ error messages
- Keyboard shortcuts ทำงานได้

### 🔧 **Troubleshooting**

#### **หากพบปัญหา:**
1. ตรวจสอบ Console สำหรับ error messages
2. ตรวจสอบ Network tab สำหรับ failed requests
3. ตรวจสอบ Firebase connection
4. ตรวจสอบ authentication status

#### **Common Issues:**
- **Authentication Error**: ตรวจสอบ login status
- **Firebase Error**: ตรวจสอบ Firebase configuration
- **Network Error**: ตรวจสอบ internet connection
- **Permission Error**: ตรวจสอบ user roles

### 📝 **การรายงานผล**

#### **Test Report Template:**
```
Date: [วันที่ทดสอบ]
Tester: [ชื่อผู้ทดสอบ]
Environment: Production (https://stock-6e930.web.app)

Test Results:
✅ Stock Transaction Flow: PASSED/FAILED
✅ Real-time Updates: PASSED/FAILED
✅ Keyboard Shortcuts: PASSED/FAILED
✅ Data Integrity: PASSED/FAILED
✅ User Experience: PASSED/FAILED

Issues Found:
- [รายการปัญหาที่พบ]

Recommendations:
- [ข้อเสนอแนะ]
```

### 🚀 **Production Readiness Checklist**

- [ ] All core functionalities working
- [ ] Stock transactions atomic and consistent
- [ ] Real-time updates functioning
- [ ] Keyboard shortcuts responsive
- [ ] Data integrity maintained
- [ ] User experience smooth
- [ ] Error handling robust
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation complete

---

**หมายเหตุ**: การทดสอบนี้ควรทำในสภาพแวดล้อมที่ปลอดภัยและมีข้อมูลสำรอง
