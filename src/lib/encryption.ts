// Data Encryption System
import crypto from 'crypto';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface DecryptionResult {
  decrypted: string;
  success: boolean;
  error?: string;
}

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits

  /**
   * สร้าง encryption key ใหม่
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * เข้ารหัสข้อมูล
   */
  encrypt(text: string, key: string): EncryptionResult {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, keyBuffer);
      cipher.setAAD(Buffer.from('stock-scribe-analyzer', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ถอดรหัสข้อมูล
   */
  decrypt(encryptedData: EncryptionResult, key: string): DecryptionResult {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, keyBuffer);
      decipher.setAAD(Buffer.from('stock-scribe-analyzer', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        decrypted,
        success: true
      };
    } catch (error) {
      return {
        decrypted: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * เข้ารหัสข้อมูลที่สำคัญ (เช่น ข้อมูลส่วนตัว)
   */
  encryptSensitiveData(data: any, key: string): EncryptionResult {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString, key);
  }

  /**
   * ถอดรหัสข้อมูลที่สำคัญ
   */
  decryptSensitiveData(encryptedData: EncryptionResult, key: string): any {
    const result = this.decrypt(encryptedData, key);
    if (!result.success) {
      throw new Error(`Decryption failed: ${result.error}`);
    }
    
    try {
      return JSON.parse(result.decrypted);
    } catch (error) {
      throw new Error(`Failed to parse decrypted data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง hash สำหรับ password
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
    
    return {
      hash,
      salt: actualSalt
    };
  }

  /**
   * ตรวจสอบ password
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hashPassword(password, salt);
    return newHash === hash;
  }

  /**
   * สร้าง random string
   */
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * สร้าง UUID
   */
  generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * สร้าง hash สำหรับข้อมูล
   */
  createHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูล
   */
  verifyHash(data: string, hash: string, algorithm: string = 'sha256'): boolean {
    const newHash = this.createHash(data, algorithm);
    return newHash === hash;
  }
}

// สร้าง instance เดียว
export const encryptionService = new EncryptionService();

// Helper functions
export function encryptUserData(userData: any, key: string): EncryptionResult {
  return encryptionService.encryptSensitiveData(userData, key);
}

export function decryptUserData(encryptedData: EncryptionResult, key: string): any {
  return encryptionService.decryptSensitiveData(encryptedData, key);
}

export function hashUserPassword(password: string): { hash: string; salt: string } {
  return encryptionService.hashPassword(password);
}

export function verifyUserPassword(password: string, hash: string, salt: string): boolean {
  return encryptionService.verifyPassword(password, hash, salt);
}

// ข้อมูลที่ต้องเข้ารหัส
export const SENSITIVE_FIELDS = [
  'password',
  'email',
  'phone',
  'address',
  'personalId',
  'bankAccount',
  'creditCard'
];

// ตรวจสอบว่าฟิลด์นี้ต้องเข้ารหัสหรือไม่
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
}

// เข้ารหัสข้อมูลตามฟิลด์
export function encryptDataByFields(data: any, key: string): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const encryptedData = { ...data };

  for (const [fieldName, value] of Object.entries(data)) {
    if (isSensitiveField(fieldName) && typeof value === 'string' && value.length > 0) {
      try {
        const encrypted = encryptionService.encrypt(value, key);
        encryptedData[fieldName] = {
          encrypted: encrypted.encrypted,
          iv: encrypted.iv,
          tag: encrypted.tag,
          isEncrypted: true
        };
      } catch (error) {
        console.error(`Failed to encrypt field ${fieldName}:`, error);
        // เก็บข้อมูลเดิมไว้ถ้าเข้ารหัสไม่ได้
      }
    }
  }

  return encryptedData;
}

// ถอดรหัสข้อมูลตามฟิลด์
export function decryptDataByFields(data: any, key: string): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const decryptedData = { ...data };

  for (const [fieldName, value] of Object.entries(data)) {
    if (isSensitiveField(fieldName) && 
        typeof value === 'object' && 
        value !== null && 
        value.isEncrypted) {
      try {
        const decrypted = encryptionService.decrypt(value, key);
        if (decrypted.success) {
          decryptedData[fieldName] = decrypted.decrypted;
        } else {
          console.error(`Failed to decrypt field ${fieldName}:`, decrypted.error);
          // เก็บข้อมูลเดิมไว้ถ้าถอดรหัสไม่ได้
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${fieldName}:`, error);
        // เก็บข้อมูลเดิมไว้ถ้าถอดรหัสไม่ได้
      }
    }
  }

  return decryptedData;
}
