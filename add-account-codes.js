import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
import firebaseAdmin from './firebase-admin-config.js';

const db = firebaseAdmin.firestore();

const accountCodes = [
  { code: '53010200', name: 'ค่าไฟฟ้า', current: 0, next: 0, notes: '' },
  { code: '53010300', name: 'ค่าน้ำประปา', current: 0, next: 0, notes: '' },
  { code: '53010400', name: 'ค่าโทรศัพท์', current: 0, next: 0, notes: '' },
  { code: '53040100', name: 'ค่าวัสดุทั่วไป', current: 0, next: 0, notes: '' },
  { code: '53040200', name: 'ค่าวัสดุงานบ้านงานครัว', current: 0, next: 0, notes: '' },
  { code: '53050100', name: 'ค่าน้ำมันเชื้อเพลิง', current: 0, next: 0, notes: '' },
  { code: '53100001', name: 'ค่าจ้าง', current: 0, next: 0, notes: '' },
  { code: '53010100', name: 'ค่าไปรษณียากรและพัสดุไปรษณีย์', current: 0, next: 0, notes: '' },
  { code: '53050500', name: 'ค่าขนส่ง', current: 0, next: 0, notes: '' },
  { code: '53100400', name: 'ค่าจ้างแรงงานและทำของ', current: 0, next: 0, notes: '' },
  { code: '53103900', name: 'ค่าจ้างแรงงาน/ทำของ-งานตามพันธกิจหลัก', current: 0, next: 0, notes: '' },
  { code: '53021100', name: 'ค่าซ่อมแซมและบำรุงรักษา', current: 0, next: 0, notes: '' },
  { code: '53060600', name: 'ค่าตอบแทน', current: 0, next: 0, notes: '' },
  { code: '53100004', name: 'ค่าเช่า', current: 0, next: 0, notes: '' },
  { code: '53040300', name: 'ค่าเช่าเครื่องถ่ายเอกสาร', current: 0, next: 0, notes: '' },
  { code: '53050200', name: 'ค่าเช่ายานพาหนะ', current: 0, next: 0, notes: '' },
  { code: '53070400', name: 'ค่าธรรมเนียม', current: 0, next: 0, notes: '' },
  { code: '53100100', name: 'ค่ารับรอง', current: 0, next: 0, notes: '' },
  { code: '53100200', name: 'ค่าใช้จ่ายในการเดินทาง', current: 0, next: 0, notes: '' },
  { code: '53100201', name: 'ค่าเดินทางเยี่ยมครอบครัว', current: 0, next: 0, notes: '' },
  { code: '53100202', name: 'ค่าเดินทางหมุนเวียนงาน ผจศ.', current: 0, next: 0, notes: '' },
  { code: '53101000', name: 'ค่าทรัพยากรสาสนเทศห้องสมุด', current: 0, next: 0, notes: '' },
  { code: '53103600', name: 'ค่าจัดประชุม/ชี้แจง', current: 0, next: 0, notes: '' },
  { code: '53101500', name: 'ค่าใช้จ่ายในการจัดงานและพิธีต่าง ๆ', current: 0, next: 0, notes: '' },
  { code: '53109900', name: 'ค่าใช้จ่ายเบ็ดเตล็ด', current: 0, next: 0, notes: '' },
  { type: 'header', name: 'หมวด 4 : เงินช่วยเหลือภายในนอกและเงินบริจาค' },
  { code: '55080300', name: 'เงินบริจาค', current: 0, next: 0, notes: '' },
  { code: '55080400', name: 'เงินช่วยเหลือพิเศษ', current: 0, next: 0, notes: '' },
  { type: 'header', name: 'หมวด 58: ค่าใช้จ่ายด้านการผลิต' },
  { code: '53110700', name: 'ค่าวัสดุผลิต - ทั่วไป', current: 0, next: 0, notes: '' },
  { type: 'main_header', name: 'รวมงบประมาณรายจ่ายสินทรัพย์' },
  { type: 'header', name: 'หมวด 7 : สินทรัพย์ถาวร' },
  { code: '10', name: 'ครุภัณฑ์เครื่องใช้ไฟฟ้าและประปา', current: 0, next: 0, notes: '' },
  { code: '16', name: 'ครุภัณฑ์เบ็ดเตล็ด', current: 0, next: 0, notes: '' },
  { code: '25', name: 'ครุภัณฑ์ยานพาหนะและขนส่ง', current: 0, next: 0, notes: '' },
  { code: '5', name: 'ค่าเสริมสร้างปรับปรุงอาคารสถานที่', current: 0, next: 0, notes: '' }
];

async function addAccountCodes() {
  try {
    console.log('🚀 เริ่มเพิ่มข้อมูล Account Codes...');
  
  const batch = db.batch();
  const accountCodesRef = db.collection('accountCodes');
  
  // เพิ่มข้อมูลแต่ละรายการ
  for (const accountCode of accountCodes) {
    const docRef = accountCodesRef.doc();
    batch.set(docRef, {
      ...accountCode,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  
  console.log(`✅ เพิ่มข้อมูล Account Codes สำเร็จ! (${accountCodes.length} รายการ)`);
  
    // แสดงรายการที่เพิ่ม
    console.log('\n📋 รายการ Account Codes ที่เพิ่ม:');
    accountCodes.forEach((item, index) => {
      if (item.type === 'header' || item.type === 'main_header') {
        console.log(`\n📌 ${item.name}`);
      } else {
        console.log(`${index + 1}. ${item.code} - ${item.name}`);
      }
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

addAccountCodes();
