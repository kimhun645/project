// สคริปต์สำหรับเพิ่ม Account Codes ลง Firestore Collection 'accountCodes'
// ใช้ใน Browser Console ของเว็บไซต์ https://stock-6e930.web.app
// เพิ่มเฉพาะ code และ name ตามที่ผู้ใช้ต้องการ

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

// Function to add account codes to Firestore collection 'accountCodes'
async function addAccountCodesToFirestore() {
  console.log('🚀 เริ่มเพิ่มข้อมูล Account Codes ลง collection "accountCodes"...');
  console.log('📋 Project ID: stock-6e930');
  console.log('📊 Database: default');
  
  try {
    // ตรวจสอบ Firebase app ที่มีอยู่
    let db;
    if (window.firebaseApp) {
      db = window.firebaseApp.firestore();
    } else if (window.firebase) {
      db = window.firebase.firestore();
    } else if (window.firebaseApp && window.firebaseApp.firestore) {
      db = window.firebaseApp.firestore();
    } else {
      // ลองหา Firebase app จาก global scope
      const firebaseApps = Object.values(window).filter(obj => 
        obj && typeof obj === 'object' && obj.firestore && typeof obj.firestore === 'function'
      );
      if (firebaseApps.length > 0) {
        db = firebaseApps[0].firestore();
      } else {
        throw new Error('ไม่พบ Firebase app ในหน้าเว็บ กรุณาเปิดหน้าเว็บที่ใช้ Firebase');
      }
    }
    
    const accountCodesRef = db.collection('accountCodes');
    
    let addedCount = 0;
    let headerCount = 0;
    
    for (const item of accountCodesData) {
      try {
        // สร้าง object ที่มีเฉพาะ code และ name
        const dataToAdd = {
          name: item.name,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        // เพิ่ม code ถ้ามี (ไม่ใช่ header)
        if (item.code) {
          dataToAdd.code = item.code;
        }
        
        // เพิ่ม type ถ้ามี
        if (item.type) {
          dataToAdd.type = item.type;
        }
        
        await accountCodesRef.add(dataToAdd);
        addedCount++;
        
        if (item.type === 'header') {
          headerCount++;
          console.log(`📁 เพิ่ม Header: ${item.name}`);
        } else {
          console.log(`✅ เพิ่ม Account Code: ${item.code} - ${item.name}`);
        }
        
      } catch (error) {
        console.error(`❌ ข้อผิดพลาดในการเพิ่ม ${item.code || 'Header'}:`, error);
      }
    }
    
    console.log(`🎉 เพิ่มข้อมูล Account Codes สำเร็จ!`);
    console.log(`📊 รวม: ${addedCount} รายการ (${addedCount - headerCount} Account Codes, ${headerCount} Headers)`);
    console.log(`📋 Collection: accountCodes`);
    console.log(`🏢 Project: stock-6e930`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// รันฟังก์ชันทันที
addAccountCodesToFirestore();
