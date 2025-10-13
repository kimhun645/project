// Node.js script สำหรับเพิ่ม Account Codes ลง Firestore
// รันด้วย: node add-account-codes-node.js

const admin = require('firebase-admin');

// กำหนดค่า Firebase Admin SDK
const serviceAccount = {
  // ใส่ service account key ที่นี่ หรือใช้ environment variable
  // หรือใช้ Application Default Credentials
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // หรือใช้ service account key
    // credential: admin.credential.cert(serviceAccount),
    projectId: 'stock-6e930'
  });
}

const db = admin.firestore();

const accountCodesData = [
  { type: 'header', name: 'หมวด 1 : ค่าใช้จ่ายเกี่ยวกับพนักงาน' },
  { code: '52021100', name: 'ค่าใช้จ่ายกิจกรรมส่งเสริมค่านิยมร่วมขององค์กร' },
  { type: 'header', name: 'หมวด 2 : ค่าใช้จ่ายดำเนินงานทั่วไป' },
  { code: '53010200', name: 'ค่าไฟฟ้า' },
  { code: '53010300', name: 'ค่าน้ำประปา' },
  { code: '53010400', name: 'ค่าโทรศัพท์' },
  { code: '53040100', name: 'ค่าวัสดุทั่วไป' },
  { code: '53040200', name: 'ค่าวัสดุงานบ้านงานครัว' },
  { code: '53050100', name: 'ค่าน้ำมันเชื้อเพลิง' },
  { code: '53100001', name: 'ค่าจ้าง' },
  { code: '53010100', name: 'ค่าไปรษณียากรและพัสดุไปรษณีย์' },
  { code: '53050500', name: 'ค่าขนส่ง' },
  { code: '53100400', name: 'ค่าจ้างแรงงานและทำของ' },
  { code: '53103900', name: 'ค่าจ้างแรงงาน/ทำของ-งานตามพันธกิจหลัก' },
  { code: '53021100', name: 'ค่าซ่อมแซมและบำรุงรักษา' },
  { code: '53060600', name: 'ค่าตอบแทน' },
  { code: '53100004', name: 'ค่าเช่า' },
  { code: '53040300', name: 'ค่าเช่าเครื่องถ่ายเอกสาร' },
  { code: '53050200', name: 'ค่าเช่ายานพาหนะ' },
  { code: '53070400', name: 'ค่าธรรมเนียม' },
  { code: '53100100', name: 'ค่ารับรอง' },
  { code: '53100200', name: 'ค่าใช้จ่ายในการเดินทาง' },
  { code: '53100201', name: 'ค่าเดินทางเยี่ยมครอบครัว' },
  { code: '53100202', name: 'ค่าเดินทางหมุนเวียนงาน ผจศ.' },
  { code: '53101000', name: 'ค่าทรัพยากรสาสนเทศห้องสมุด' },
  { code: '53103600', name: 'ค่าจัดประชุม/ชี้แจง' },
  { code: '53101500', name: 'ค่าใช้จ่ายในการจัดงานและพิธีต่าง ๆ' },
  { code: '53109900', name: 'ค่าใช้จ่ายเบ็ดเตล็ด' },
  { type: 'header', name: 'หมวด 4 : เงินช่วยเหลือภายในนอกและเงินบริจาค' },
  { code: '55080300', name: 'เงินบริจาค' },
  { code: '55080400', name: 'เงินช่วยเหลือพิเศษ' },
  { type: 'header', name: 'หมวด 58: ค่าใช้จ่ายด้านการผลิต' },
  { code: '53110700', name: 'ค่าวัสดุผลิต - ทั่วไป' }
];

async function addAccountCodes() {
  console.log('🚀 เริ่มเพิ่มข้อมูล Account Codes ลง Firestore...');
  console.log('📋 Project ID: stock-6e930');
  
  try {
    const batch = db.batch();
    const accountCodesRef = db.collection('accountCodes');
    
    let addedCount = 0;
    let headerCount = 0;
    
    for (const item of accountCodesData) {
      const docRef = accountCodesRef.doc();
      const dataToAdd = {
        name: item.name,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (item.code) {
        dataToAdd.code = item.code;
      }
      
      if (item.type) {
        dataToAdd.type = item.type;
      }
      
      batch.set(docRef, dataToAdd);
      addedCount++;
      
      if (item.type === 'header') {
        headerCount++;
        console.log(`📁 เพิ่ม Header: ${item.name}`);
      } else {
        console.log(`✅ เพิ่ม Account Code: ${item.code} - ${item.name}`);
      }
    }
    
    await batch.commit();
    
    console.log(`🎉 เพิ่มข้อมูล Account Codes สำเร็จ!`);
    console.log(`📊 รวม: ${addedCount} รายการ (${addedCount - headerCount} Account Codes, ${headerCount} Headers)`);
    console.log(`📋 Collection: accountCodes`);
    console.log(`🏢 Project: stock-6e930`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

// รันฟังก์ชัน
addAccountCodes();
