import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'staff' | 'manager' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: 'staff' | 'manager' | 'admin';
}

export interface UpdateUserData {
  displayName?: string;
  role?: 'staff' | 'manager' | 'admin';
  isActive?: boolean;
}

// Role definitions
export const USER_ROLES: UserRole[] = [
  {
    id: 'staff',
    name: 'เจ้าหน้าที่',
    permissions: [
      'products:read',
      'products:create',
      'products:update',
      'categories:read',
      'categories:create',
      'categories:update',
      'suppliers:read',
      'suppliers:create',
      'suppliers:update',
      'movements:read',
      'movements:create',
      'movements:update',
      'reports:read',
      'budget:read',
      'budget:create',
      'budget:update'
    ],
    description: 'สามารถใช้งานระบบได้ทุกฟีเจอร์ ยกเว้นการอนุมัติและตั้งค่าระบบ',
    color: 'blue'
  },
  {
    id: 'manager',
    name: 'ผู้จัดการศูนย์',
    permissions: [
      'products:read',
      'products:create',
      'products:update',
      'products:delete',
      'categories:read',
      'categories:create',
      'categories:update',
      'categories:delete',
      'suppliers:read',
      'suppliers:create',
      'suppliers:update',
      'suppliers:delete',
      'movements:read',
      'movements:create',
      'movements:update',
      'movements:delete',
      'reports:read',
      'reports:export',
      'budget:read',
      'budget:create',
      'budget:update',
      'budget:approve',
      'approval:read',
      'approval:approve',
      'approval:reject'
    ],
    description: 'สามารถใช้งานได้ทุกฟีเจอร์ รวมถึงการอนุมัติและจัดการข้อมูล',
    color: 'green'
  },
  {
    id: 'admin',
    name: 'ผู้ดูแลระบบ',
    permissions: [
      'products:read',
      'products:create',
      'products:update',
      'products:delete',
      'categories:read',
      'categories:create',
      'categories:update',
      'categories:delete',
      'suppliers:read',
      'suppliers:create',
      'suppliers:update',
      'suppliers:delete',
      'movements:read',
      'movements:create',
      'movements:update',
      'movements:delete',
      'reports:read',
      'reports:export',
      'budget:read',
      'budget:create',
      'budget:update',
      'budget:approve',
      'approval:read',
      'approval:approve',
      'approval:reject',
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'settings:read',
      'settings:update',
      'system:admin'
    ],
    description: 'สามารถใช้งานได้ทุกฟีเจอร์ รวมถึงการจัดการผู้ใช้และตั้งค่าระบบ',
    color: 'red'
  }
];

class UserService {
  private auth = auth;
  private db = db;

  // Get current user
  getCurrentUser(): Promise<FirebaseUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  // Sign in with retry mechanism
  async signIn(email: string, password: string, retryCount = 0): Promise<User> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      console.log('🔐 Attempting to sign in with email:', email);
      console.log('🔐 Firebase Auth instance:', this.auth);
      console.log('🔐 Auth domain:', this.auth.config.authDomain);
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Sign in successful:', userCredential.user.uid);
      
      const user = await this.getUserById(userCredential.user.uid);
      
      // Update last login
      await this.updateLastLogin(userCredential.user.uid);
      
      return user;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', error);
      
      // Handle network errors with retry
      if (error.code === 'auth/network-request-failed' && retryCount < maxRetries) {
        console.log(`🔄 Retrying sign in (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return this.signIn(email, password, retryCount + 1);
      }
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-credential') {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('ไม่พบผู้ใช้ในระบบ');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('บัญชีผู้ใช้นี้ถูกปิดใช้งาน');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('รหัสผ่านไม่แข็งแรงพอ');
      } else {
        throw new Error(this.getErrorMessage(error.code) || `เกิดข้อผิดพลาด: ${error.message}`);
      }
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw new Error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  }

  // Create user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        userData.email, 
        userData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: userData.displayName
      });

      // Create user document in Firestore
      const user: User = {
        id: userCredential.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: (await this.getCurrentUser())?.uid
      };

      await setDoc(doc(this.db, 'users', user.id), user);
      
      return user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      console.log('🔍 getUserById called with userId:', userId);
      console.log('🔍 Database instance:', this.db);
      
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      console.log('🔍 User document exists:', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.log('❌ User document does not exist');
        throw new Error('ไม่พบข้อมูลผู้ใช้');
      }
      
      const userData = userDoc.data() as User;
      console.log('🔍 User data retrieved:', userData);
      console.log('🔍 User role:', userData.role);
      console.log('🔍 User displayName:', userData.displayName);
      
      return userData;
    } catch (error: any) {
      console.error('❌ Error in getUserById:', error);
      console.error('❌ Error message:', error.message);
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }
  }

  // Create user document (for existing Firebase users)
  async createUserDocument(user: User): Promise<void> {
    try {
      await setDoc(doc(this.db, 'users', user.id), user);
    } catch (error: any) {
      throw new Error('ไม่สามารถสร้างข้อมูลผู้ใช้ได้');
    }
  }

  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const usersCollection = collection(this.db, 'users');
      const querySnapshot = await getDocs(usersCollection);

      const users = querySnapshot.docs.map(doc => doc.data() as User);

      // Sort in memory instead of using Firestore orderBy
      return users.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้: ' + error.message);
    }
  }

  // Update user
  async updateUser(userId: string, userData: UpdateUserData): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      throw new Error('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
    }
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🗑️ กำลังลบผู้ใช้จาก Firestore:', userId);
      console.log('🔍 ตรวจสอบ userId:', userId);
      console.log('🔍 ตรวจสอบ db instance:', this.db);
      
      const userDocRef = doc(this.db, 'users', userId);
      console.log('🔍 ตรวจสอบ userDocRef:', userDocRef);
      
      await deleteDoc(userDocRef);
      console.log('✅ ลบผู้ใช้จาก Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการลบผู้ใช้จาก Firestore:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      throw new Error(`ไม่สามารถลบผู้ใช้ได้: ${error.message}`);
    }
  }

  // Update last login
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Check permission
  hasPermission(userRole: string, permission: string): boolean {
    const role = USER_ROLES.find(r => r.id === userRole);
    return role ? role.permissions.includes(permission) : false;
  }

  // Get role info
  getRoleInfo(roleId: string): UserRole | undefined {
    return USER_ROLES.find(role => role.id === roleId);
  }

  // Get all roles
  getAllRoles(): UserRole[] {
    return USER_ROLES;
  }

  // Error message mapping
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'ไม่พบผู้ใช้ในระบบ',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
      'auth/weak-password': 'รหัสผ่านไม่แข็งแรงพอ',
      'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'auth/too-many-requests': 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่',
      'auth/network-request-failed': 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย',
      'auth/user-disabled': 'บัญชีผู้ใช้นี้ถูกปิดใช้งาน',
      'auth/operation-not-allowed': 'การดำเนินการนี้ไม่ได้รับอนุญาต'
    };
    
    return errorMessages[errorCode] || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('ไม่มีผู้ใช้ที่เข้าสู่ระบบ');
    }

    if (!user.email) {
      throw new Error('ไม่พบอีเมลของผู้ใช้');
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      console.log('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
