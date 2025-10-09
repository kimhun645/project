-- สร้างฐานข้อมูล stocknrs (รันใน PostgreSQL admin tool หรือ psql)
-- CREATE DATABASE stocknrs;

-- ใช้ฐานข้อมูล stocknrs
-- \c stocknrs;

-- สร้างตาราง categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_medicine BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- การตั้งค่าระบบ (เก็บค่า Settings ของแอปพลิเคชัน 1 แถว)
CREATE TABLE IF NOT EXISTS app_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    low_stock_alert BOOLEAN NOT NULL DEFAULT TRUE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    auto_backup BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(10) NOT NULL DEFAULT 'light',
    language VARCHAR(5) NOT NULL DEFAULT 'th',
    currency VARCHAR(10) NOT NULL DEFAULT 'THB',
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT FALSE,
    smtp_user VARCHAR(255),
    smtp_password VARCHAR(255),
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- แทรกค่าเริ่มต้นถ้ายังไม่มีข้อมูล
INSERT INTO app_settings (
    id, company_name, email, phone, address,
    low_stock_alert, email_notifications, auto_backup,
    theme, language, currency
) VALUES (
    1,
    'StockFlow Inc.',
    'admin@stockflow.com',
    '+66 123 456 789',
    '123 Business Street, Bangkok, Thailand',
    TRUE, TRUE, TRUE,
    'light', 'th', 'THB'
) ON CONFLICT (id) DO NOTHING;

-- สร้างตาราง suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER,
    unit VARCHAR(50),
    location VARCHAR(255),
    barcode VARCHAR(255),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง movements (การเคลื่อนไหวสินค้า)
CREATE TABLE IF NOT EXISTS movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- สร้างตาราง account_codes
CREATE TABLE IF NOT EXISTS account_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- สร้างตาราง budget_requests
CREATE TABLE IF NOT EXISTS budget_requests (
    id SERIAL PRIMARY KEY,
    request_no VARCHAR(50) UNIQUE NOT NULL,
    requester VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    material_list JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง approvals
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id INTEGER REFERENCES budget_requests(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL,
    remark TEXT,
    approver_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง users (สำหรับการจัดการผู้ใช้ระบบ)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- โทเค็นสำหรับรีเซ็ตรหัสผ่าน
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง approvers (ผู้อนุมัติ)
CREATE TABLE IF NOT EXISTS approvers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255),
    position VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง access_codes (รหัสเข้าถึง)
CREATE TABLE IF NOT EXISTS access_codes (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง approval_logs (บันทึกการอนุมัติ)
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id INTEGER REFERENCES budget_requests(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    approver_name VARCHAR(255) NOT NULL,
    decision VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- แทรกข้อมูลผู้อนุมัติตัวอย่าง
INSERT INTO approvers (name, email, department, position) VALUES 
('ผู้บริหารระดับสูง', 'admin@stockflow.com', 'ฝ่ายบริหาร', 'ผู้จัดการศูนย์'),
('ผู้พิจารณา 1', 'approver1@stockflow.com', 'ฝ่ายการเงิน', 'หัวหน้าฝ่ายการเงิน'),
('ผู้พิจารณา 2', 'approver2@stockflow.com', 'ฝ่ายจัดซื้อ', 'หัวหน้าฝ่ายจัดซื้อ')
ON CONFLICT (email) DO NOTHING;

-- สร้าง indexes สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires ON access_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_approval_logs_request ON approval_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_budget_requests_status ON budget_requests(status);
CREATE INDEX IF NOT EXISTS idx_budget_requests_request_no ON budget_requests(request_no);

-- สร้าง trigger สำหรับการอัพเดท updated_at ใน products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มข้อมูลตัวอย่าง account_codes
INSERT INTO account_codes (code, name) VALUES 
    ('ACC001', 'วัสดุสำนักงาน'),
    ('ACC002', 'วัสดุการแพทย์'),
    ('ACC003', 'อุปกรณ์ไฟฟ้า'),
    ('ACC004', 'วัสดุก่อสร้าง'),
    ('ACC005', 'วัสดุทำความสะอาด')
ON CONFLICT (code) DO NOTHING;

-- สร้างตาราง materials (วัสดุสำหรับคำขออนุมัติ)
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT 'ชิ้น',
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่มข้อมูลตัวอย่าง materials
INSERT INTO materials (name, description, unit, category) VALUES 
    ('กระดาษ A4', 'กระดาษสำหรับพิมพ์เอกสาร', 'รีม', 'วัสดุสำนักงาน'),
    ('ปากกา', 'ปากกาสำหรับเขียน', 'ด้าม', 'วัสดุสำนักงาน'),
    ('ดินสอ', 'ดินสอสำหรับเขียน', 'ด้าม', 'วัสดุสำนักงาน'),
    ('ยางลบ', 'ยางลบสำหรับลบดินสอ', 'ชิ้น', 'วัสดุสำนักงาน'),
    ('ไม้บรรทัด', 'ไม้บรรทัดสำหรับวัด', 'อัน', 'วัสดุสำนักงาน'),
    ('เครื่องคิดเลข', 'เครื่องคิดเลขสำหรับคำนวณ', 'เครื่อง', 'อุปกรณ์สำนักงาน'),
    ('แฟ้มเอกสาร', 'แฟ้มสำหรับเก็บเอกสาร', 'เล่ม', 'วัสดุสำนักงาน'),
    ('คลิปหนีบกระดาษ', 'คลิปสำหรับหนีบกระดาษ', 'กล่อง', 'วัสดุสำนักงาน'),
    ('เทปกาว', 'เทปกาวสำหรับติด', 'ม้วน', 'วัสดุสำนักงาน'),
    ('ปากกามาร์คเกอร์', 'ปากกาสำหรับไฮไลท์', 'ด้าม', 'วัสดุสำนักงาน'),
    ('กระดาษโน๊ต', 'กระดาษสำหรับจดบันทึก', 'เล่ม', 'วัสดุสำนักงาน'),
    ('ที่เย็บกระดาษ', 'เครื่องเย็บกระดาษ', 'เครื่อง', 'อุปกรณ์สำนักงาน'),
    ('หมึกเครื่องพิมพ์', 'หมึกสำหรับเครื่องพิมพ์', 'ตลับ', 'วัสดุสำนักงาน'),
    ('กระดาษถ่ายเอกสาร', 'กระดาษสำหรับถ่ายเอกสาร', 'รีม', 'วัสดุสำนักงาน'),
    ('ซองจดหมาย', 'ซองสำหรับใส่จดหมาย', 'ซอง', 'วัสดุสำนักงาน')
ON CONFLICT DO NOTHING;

-- เพิ่มข้อมูลตัวอย่าง categories
INSERT INTO categories (name, description, is_medicine) VALUES 
    ('วัสดุการแพทย์', 'ยาและเวชภัณฑ์', true),
    ('วัสดุสำนักงาน', 'อุปกรณ์สำนักงานทั่วไป', false),
    ('อุปกรณ์ไฟฟ้า', 'อุปกรณ์และเครื่องใช้ไฟฟ้า', false),
    ('วัสดุทำความสะอาด', 'น้ำยาและอุปกรณ์ทำความสะอาด', false)
ON CONFLICT DO NOTHING;
