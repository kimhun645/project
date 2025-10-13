// สคริปต์สำหรับเพิ่ม Account Codes ลง Firestore Collection 'accountCodes'
// รันใน Browser Console ของเว็บไซต์ https://stock-6e930.web.app

const accountCodes = [
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
  { code: '53110700', name: 'ค่าวัสดุผลิต - ทั่วไป' },
  { type: 'main_header', name: 'รวมงบประมาณรายจ่ายสินทรัพย์' },
  { type: 'header', name: 'หมวด 7 : สินทรัพย์ถาวร' },
  { code: '10', name: 'ครุภัณฑ์เครื่องใช้ไฟฟ้าและประปา' },
  { code: '16', name: 'ครุภัณฑ์เบ็ดเตล็ด' },
  { code: '25', name: 'ครุภัณฑ์ยานพาหนะและขนส่ง' },
  { code: '5', name: 'ค่าเสริมสร้างปรับปรุงอาคารสถานที่' }
];

// Function to add account codes to Firestore collection 'accountCodes'
async function addAccountCodesToFirestore() {
  console.log('🚀 เริ่มเพิ่มข้อมูล Account Codes ลง collection "accountCodes"...');
  
  try {
    // ใช้ Firebase app ที่มีอยู่แล้วในหน้าเว็บ
    const db = window.firebaseApp.firestore();
    const accountCodesRef = db.collection('accountCodes');
    
    let addedCount = 0;
    
    for (const accountCode of accountCodes) {
      try {
        await accountCodesRef.add({
          ...accountCode,
          created_at: new Date(),
          updated_at: new Date()
        });
        addedCount++;
        console.log(`✅ เพิ่ม: ${accountCode.code || 'Header'} - ${accountCode.name}`);
      } catch (error) {
        console.error(`❌ ข้อผิดพลาดในการเพิ่ม ${accountCode.code || 'Header'}:`, error);
      }
    }
    
    console.log(`🎉 เพิ่มข้อมูล Account Codes สำเร็จ! (${addedCount}/${accountCodes.length} รายการ)`);
    console.log(`📊 Collection: accountCodes`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// รันฟังก์ชันทันที
addAccountCodesToFirestore();
