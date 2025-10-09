# 🗄️ SQL to Firestore Mapping Guide

## 📊 **14 Tables → 14 Collections Mapping**

### **1. categories (SQL Table) → categories (Firestore Collection)**
```javascript
// SQL: CREATE TABLE categories
// Firestore: Collection "categories"
{
  "categories": {
    "doc_id_1": {
      "name": "เครื่องเขียน",
      "description": "อุปกรณ์เครื่องเขียนต่างๆ",
      "is_medicine": false,
      "created_at": "2025-09-08T10:00:00Z"
    },
    "doc_id_2": {
      "name": "อุปกรณ์สำนักงาน",
      "description": "อุปกรณ์สำหรับสำนักงาน",
      "is_medicine": false,
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **2. app_settings (SQL Table) → app_settings (Firestore Collection)**
```javascript
// SQL: CREATE TABLE app_settings (1 row)
// Firestore: Collection "app_settings" (1 document)
{
  "app_settings": {
    "settings": {
      "company_name": "StockFlow Inc.",
      "email": "admin@stockflow.com",
      "phone": "+66 123 456 789",
      "address": "123 Business Street, Bangkok, Thailand",
      "low_stock_alert": true,
      "email_notifications": true,
      "auto_backup": true,
      "theme": "light",
      "language": "th",
      "currency": "THB",
      "updated_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **3. suppliers (SQL Table) → suppliers (Firestore Collection)**
```javascript
// SQL: CREATE TABLE suppliers
// Firestore: Collection "suppliers"
{
  "suppliers": {
    "doc_id_1": {
      "name": "บริษัท เอ บี ซี จำกัด",
      "email": "abc@example.com",
      "phone": "02-123-4567",
      "address": "กรุงเทพฯ",
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **4. products (SQL Table) → products (Firestore Collection)**
```javascript
// SQL: CREATE TABLE products (with foreign keys)
// Firestore: Collection "products" (store IDs as strings)
{
  "products": {
    "doc_id_1": {
      "name": "ปากกาลูกลื่น",
      "sku": "PEN001",
      "description": "ปากกาลูกลื่นสีน้ำเงิน",
      "category_id": "category_doc_id_1", // Reference to categories
      "supplier_id": "supplier_doc_id_1", // Reference to suppliers
      "unit_price": 15,
      "current_stock": 100,
      "min_stock": 10,
      "max_stock": 500,
      "unit": "ด้าม",
      "location": "ชั้น A1",
      "barcode": "1234567890123",
      "expiry_date": null,
      "created_at": "2025-09-08T10:00:00Z",
      "updated_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **5. movements (SQL Table) → movements (Firestore Collection)**
```javascript
// SQL: CREATE TABLE movements (with foreign key to products)
// Firestore: Collection "movements"
{
  "movements": {
    "doc_id_1": {
      "product_id": "product_doc_id_1", // Reference to products
      "type": "in", // 'in' or 'out'
      "quantity": 50,
      "reason": "รับสินค้าใหม่",
      "reference": "PO-001",
      "notes": "สั่งซื้อจากผู้จัดจำหน่าย",
      "created_at": "2025-09-08T10:00:00Z",
      "created_by": "user_doc_id_1"
    }
  }
}
```

### **6. account_codes (SQL Table) → accountCodes (Firestore Collection)**
```javascript
// SQL: CREATE TABLE account_codes
// Firestore: Collection "accountCodes"
{
  "accountCodes": {
    "doc_id_1": {
      "code": "ACC001",
      "name": "บัญชีวัสดุสิ้นเปลือง"
    },
    "doc_id_2": {
      "code": "ACC002",
      "name": "บัญชีอุปกรณ์สำนักงาน"
    }
  }
}
```

### **7. budget_requests (SQL Table) → budgetRequests (Firestore Collection)**
```javascript
// SQL: CREATE TABLE budget_requests (with JSONB material_list)
// Firestore: Collection "budgetRequests" (store array directly)
{
  "budgetRequests": {
    "doc_id_1": {
      "request_no": "REQ-2025-001",
      "requester": "นายสมชาย ใจดี",
      "request_date": "2025-09-08",
      "account_code": "ACC001",
      "account_name": "บัญชีวัสดุสิ้นเปลือง",
      "amount": 50000,
      "note": "ขออนุมัติซื้อวัสดุสิ้นเปลืองประจำเดือน",
      "material_list": [ // Array instead of JSONB
        {
          "name": "กระดาษ A4",
          "quantity": 10,
          "unit": "รีม",
          "price": 120
        }
      ],
      "status": "PENDING", // 'PENDING', 'APPROVED', 'REJECTED'
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **8. approvals (SQL Table) → approvals (Firestore Collection)**
```javascript
// SQL: CREATE TABLE approvals (with foreign key to budget_requests)
// Firestore: Collection "approvals"
{
  "approvals": {
    "doc_id_1": {
      "request_id": "budget_request_doc_id_1", // Reference to budgetRequests
      "decision": "APPROVED",
      "remark": "อนุมัติตามที่ขอ",
      "approver_name": "ผู้บริหารระดับสูง",
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **9. users (SQL Table) → users (Firestore Collection)**
```javascript
// SQL: CREATE TABLE users
// Firestore: Collection "users"
{
  "users": {
    "doc_id_1": {
      "username": "admin",
      "email": "admin@stockflow.com",
      "password_hash": "hashed_password_here",
      "role": "admin", // 'admin', 'manager', 'user'
      "is_active": true,
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **10. password_resets (SQL Table) → passwordResets (Firestore Collection)**
```javascript
// SQL: CREATE TABLE password_resets (with foreign key to users)
// Firestore: Collection "passwordResets"
{
  "passwordResets": {
    "doc_id_1": {
      "user_id": "user_doc_id_1", // Reference to users
      "token": "reset_token_here",
      "expires_at": "2025-09-09T10:00:00Z",
      "used": false,
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **11. approvers (SQL Table) → approvers (Firestore Collection)**
```javascript
// SQL: CREATE TABLE approvers
// Firestore: Collection "approvers"
{
  "approvers": {
    "doc_id_1": {
      "name": "ผู้บริหารระดับสูง",
      "email": "admin@stockflow.com",
      "department": "ฝ่ายบริหาร",
      "position": "ผู้จัดการศูนย์",
      "is_active": true,
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **12. access_codes (SQL Table) → accessCodes (Firestore Collection)**
```javascript
// SQL: CREATE TABLE access_codes (email as PRIMARY KEY)
// Firestore: Collection "accessCodes" (use email as document ID)
{
  "accessCodes": {
    "user@example.com": { // Use email as document ID
      "code": "123456",
      "expires_at": "2025-09-08T11:00:00Z",
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **13. approval_logs (SQL Table) → approvalLogs (Firestore Collection)**
```javascript
// SQL: CREATE TABLE approval_logs (with foreign key to budget_requests)
// Firestore: Collection "approvalLogs"
{
  "approvalLogs": {
    "doc_id_1": {
      "request_id": "budget_request_doc_id_1", // Reference to budgetRequests
      "action": "CREATE_REQUEST",
      "approver_name": "นายสมชาย ใจดี",
      "decision": null,
      "remark": "สร้างคำขอใหม่",
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

### **14. materials (SQL Table) → materials (Firestore Collection)**
```javascript
// SQL: CREATE TABLE materials
// Firestore: Collection "materials"
{
  "materials": {
    "doc_id_1": {
      "name": "กระดาษ A4",
      "description": "กระดาษสำหรับพิมพ์เอกสาร",
      "unit": "รีม",
      "category": "วัสดุสำนักงาน",
      "is_active": true,
      "created_at": "2025-09-08T10:00:00Z"
    }
  }
}
```

## 🔄 **Key Differences: SQL vs Firestore**

| Aspect | SQL (PostgreSQL) | Firestore (NoSQL) |
|--------|------------------|-------------------|
| **Structure** | Tables with rows/columns | Collections with documents |
| **Relationships** | Foreign keys + JOINs | Document references or embedded data |
| **Data Types** | Strict schema | Flexible document structure |
| **Queries** | SQL SELECT statements | Firestore query methods |
| **Indexes** | CREATE INDEX | Automatic + composite indexes |
| **Transactions** | ACID transactions | Firestore transactions |
| **Scalability** | Vertical scaling | Horizontal scaling |

## 📝 **Migration Notes**

1. **Foreign Keys** → Store as document ID strings or use Firestore references
2. **JSONB** → Store as arrays or nested objects
3. **UUIDs** → Use Firestore auto-generated document IDs or custom IDs
4. **Timestamps** → Use Firestore Timestamp objects
5. **Constraints** → Handle in application logic or Firestore Rules
6. **Indexes** → Configure in `firestore.indexes.json`

## 🚀 **Next Steps**

1. Create Firestore Collections based on this mapping
2. Set up Firestore Rules for security
3. Configure indexes for query performance
4. Migrate data from SQL to Firestore format
5. Update application code to use Firestore SDK
