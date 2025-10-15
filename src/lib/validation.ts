import { z } from 'zod';

// Base validation schemas
export const emailSchema = z.string().email('รูปแบบอีเมลไม่ถูกต้อง');
export const passwordSchema = z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
export const phoneSchema = z.string().regex(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');

// Product validation
export const productSchema = z.object({
  name: z.string().min(1, 'ชื่อสินค้าต้องไม่ว่าง').max(100, 'ชื่อสินค้าไม่เกิน 100 ตัวอักษร'),
  sku: z.string().min(1, 'SKU ต้องไม่ว่าง').max(50, 'SKU ไม่เกิน 50 ตัวอักษร'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'ต้องเลือกหมวดหมู่'),
  supplierId: z.string().min(1, 'ต้องเลือกซัพพลายเออร์'),
  price: z.number().min(0, 'ราคาต้องไม่เป็นลบ'),
  currentStock: z.number().int().min(0, 'จำนวนสต็อกต้องไม่เป็นลบ'),
  minStock: z.number().int().min(0, 'จำนวนสต็อกขั้นต่ำต้องไม่เป็นลบ'),
  maxStock: z.number().int().min(0, 'จำนวนสต็อกสูงสุดต้องไม่เป็นลบ').optional(),
  unit: z.string().min(1, 'หน่วยต้องไม่ว่าง'),
  location: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNo: z.string().optional(),
});

// Category validation
export const categorySchema = z.object({
  name: z.string().min(1, 'ชื่อหมวดหมู่ต้องไม่ว่าง').max(50, 'ชื่อหมวดหมู่ไม่เกิน 50 ตัวอักษร'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'สีต้องเป็นรูปแบบ HEX (#RRGGBB)').optional(),
});

// Supplier validation
export const supplierSchema = z.object({
  name: z.string().min(1, 'ชื่อซัพพลายเออร์ต้องไม่ว่าง').max(100, 'ชื่อซัพพลายเออร์ไม่เกิน 100 ตัวอักษร'),
  contactPerson: z.string().min(1, 'ชื่อผู้ติดต่อต้องไม่ว่าง'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1, 'ที่อยู่ต้องไม่ว่าง'),
  taxId: z.string().optional(),
  website: z.string().url('URL ไม่ถูกต้อง').optional(),
});

// Movement validation
export const movementSchema = z.object({
  productId: z.string().min(1, 'ต้องเลือกสินค้า'),
  type: z.enum(['in', 'out'], { required_error: 'ต้องเลือกประเภทการเคลื่อนไหว' }),
  quantity: z.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
  reason: z.string().min(1, 'เหตุผลต้องไม่ว่าง'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().min(1, 'ต้องระบุผู้สร้าง'),
});

// Receipt validation
export const receiptSchema = z.object({
  receiptNo: z.string().min(1, 'เลขที่รับต้องไม่ว่าง'),
  supplier: z.string().min(1, 'ซัพพลายเออร์ต้องไม่ว่าง'),
  receivedBy: z.string().min(1, 'ผู้รับต้องไม่ว่าง'),
  items: z.array(z.object({
    productId: z.string().min(1, 'ต้องเลือกสินค้า'),
    productName: z.string().min(1, 'ชื่อสินค้าต้องไม่ว่าง'),
    productSku: z.string().optional(),
    quantity: z.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
    unit: z.string().min(1, 'หน่วยต้องไม่ว่าง'),
    unitPrice: z.number().min(0, 'ราคาต่อหน่วยต้องไม่เป็นลบ'),
    totalPrice: z.number().min(0, 'ราคารวมต้องไม่เป็นลบ'),
    supplier: z.string().optional(),
    batchNo: z.string().optional(),
    expiryDate: z.string().optional(),
  })).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
  totalAmount: z.number().min(0, 'ยอดรวมต้องไม่เป็นลบ'),
  notes: z.string().optional(),
});

// Withdrawal validation
export const withdrawalSchema = z.object({
  withdrawalNo: z.string().min(1, 'เลขที่เบิกต้องไม่ว่าง'),
  requestedBy: z.string().min(1, 'ผู้ขอเบิกต้องไม่ว่าง'),
  approvedBy: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'ต้องเลือกสินค้า'),
    productName: z.string().min(1, 'ชื่อสินค้าต้องไม่ว่าง'),
    productSku: z.string().optional(),
    quantity: z.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
    unit: z.string().min(1, 'หน่วยต้องไม่ว่าง'),
    reason: z.string().min(1, 'เหตุผลต้องไม่ว่าง'),
  })).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
  notes: z.string().optional(),
});

// User validation
export const userSchema = z.object({
  email: emailSchema,
  displayName: z.string().min(1, 'ชื่อแสดงต้องไม่ว่าง').max(100, 'ชื่อแสดงไม่เกิน 100 ตัวอักษร'),
  role: z.enum(['admin', 'manager', 'user'], { required_error: 'ต้องเลือกบทบาท' }),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: phoneSchema.optional(),
  isActive: z.boolean().default(true),
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'รหัสผ่านปัจจุบันต้องไม่ว่าง'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'ยืนยันรหัสผ่านต้องไม่ว่าง'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'รหัสผ่านใหม่ไม่ตรงกัน',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน',
  path: ['newPassword'],
});

// Budget request validation
export const budgetRequestSchema = z.object({
  requestCode: z.string().min(1, 'รหัสคำขอต้องไม่ว่าง'),
  title: z.string().min(1, 'หัวข้อต้องไม่ว่าง').max(200, 'หัวข้อไม่เกิน 200 ตัวอักษร'),
  description: z.string().min(1, 'รายละเอียดต้องไม่ว่าง'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่เป็นลบ'),
  category: z.string().min(1, 'หมวดหมู่ต้องไม่ว่าง'),
  priority: z.enum(['low', 'medium', 'high'], { required_error: 'ต้องเลือกความสำคัญ' }),
  requestedBy: z.string().min(1, 'ผู้ขอต้องไม่ว่าง'),
  department: z.string().min(1, 'แผนกต้องไม่ว่าง'),
  expectedDate: z.string().min(1, 'วันที่คาดหวังต้องไม่ว่าง'),
  justification: z.string().min(1, 'เหตุผลต้องไม่ว่าง'),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'คำค้นหาต้องไม่ว่าง').max(100, 'คำค้นหาไม่เกิน 100 ตัวอักษร'),
  type: z.enum(['products', 'categories', 'suppliers', 'movements']).optional(),
  filters: z.record(z.any()).optional(),
});

// Export validation functions
export const validateProduct = (data: unknown) => productSchema.parse(data);
export const validateCategory = (data: unknown) => categorySchema.parse(data);
export const validateSupplier = (data: unknown) => supplierSchema.parse(data);
export const validateMovement = (data: unknown) => movementSchema.parse(data);
export const validateReceipt = (data: unknown) => receiptSchema.parse(data);
export const validateWithdrawal = (data: unknown) => withdrawalSchema.parse(data);
export const validateUser = (data: unknown) => userSchema.parse(data);
export const validateLogin = (data: unknown) => loginSchema.parse(data);
export const validateChangePassword = (data: unknown) => changePasswordSchema.parse(data);
export const validateBudgetRequest = (data: unknown) => budgetRequestSchema.parse(data);
export const validateSearch = (data: unknown) => searchSchema.parse(data);

// Safe validation functions that return errors instead of throwing
export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      success: false,
      errors: ['เกิดข้อผิดพลาดในการตรวจสอบข้อมูล']
    };
  }
};
