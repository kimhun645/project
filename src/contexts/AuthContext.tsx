import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { userService, User } from '@/lib/userService';
import { auth } from '@/lib/firebase';
import { auth as apiAuth } from '@/lib/apiService';

interface AuthContextType {
  currentUser: User | null;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
  sessionWarning: boolean;
  timeRemaining: number;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user?.email);
      if (user) {
        setFirebaseUser(user);

        // Get Firebase ID Token and set it for API service
        try {
          const idToken = await user.getIdToken();
          console.log('🔐 Setting Firebase ID Token for API service');
          apiAuth.setFirebaseIdToken(idToken);
        } catch (tokenError) {
          console.error('Failed to get Firebase ID Token:', tokenError);
        }

        try {
          console.log('🔍 AuthContext: Loading user data for UID:', user.uid);
          const userData = await userService.getUserById(user.uid);
          console.log('✅ AuthContext: User data loaded:', userData);
          console.log('✅ AuthContext: User role:', userData.role);
          console.log('✅ AuthContext: User displayName:', userData.displayName);
          setCurrentUser(userData);
        } catch (error) {
          console.log('User not found in Firestore, creating new user document...');
          try {
            const newUser: User = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'ผู้ใช้ใหม่',
              role: 'user',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            };

            await userService.createUserDocument(newUser);
            setCurrentUser(newUser);
            console.log('User document created successfully');
          } catch (createError) {
            console.error('Error creating user document:', createError);
            const fallbackUser: User = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'ผู้ใช้ใหม่',
              role: 'user',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            };
            setCurrentUser(fallbackUser);
          }
        }
      } else {
        console.log('User logged out');
        apiAuth.setFirebaseIdToken(null);
        setCurrentUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const userData = await userService.getUserById(uid);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Signing in:', email);
      console.log('🔐 AuthContext: Firebase Auth instance:', auth);
      console.log('🔐 AuthContext: Auth domain:', auth.config.authDomain);
      
      const user = await userService.signIn(email, password);
      console.log('✅ AuthContext: Sign in successful:', user);
      console.log('✅ AuthContext: User role:', user.role);
      console.log('✅ AuthContext: User displayName:', user.displayName);
      setCurrentUser(user);

      // บันทึก logs การ login
      try {
        const { LogService } = await import('@/lib/logService');
        await LogService.log(
          user.id,
          user.displayName || user.email,
          user.role,
          'LOGIN',
          `เข้าสู่ระบบ: ${user.displayName || user.email}`,
          'Authentication',
          {
            resourceId: user.id,
            severity: 'success',
            metadata: {
              userEmail: user.email,
              userRole: user.role,
              loginTime: new Date().toISOString()
            }
          }
        );
        
        // Trigger log viewer refresh if on settings page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/settings')) {
          window.dispatchEvent(new CustomEvent('logRefresh'));
        }
      } catch (logError) {
        console.error('Failed to log login:', logError);
      }

      const firebaseUser = await userService.getCurrentUser();
      setFirebaseUser(firebaseUser);

      // Get and set Firebase ID Token
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log('🔐 Setting Firebase ID Token after sign in');
          apiAuth.setFirebaseIdToken(idToken);
        } catch (tokenError) {
          console.error('Failed to get Firebase ID Token after sign in:', tokenError);
        }
      }

      // บันทึก logs การ login
      if (currentUser) {
        try {
          const { LogService } = await import('@/lib/logService');
          await LogService.log(
            currentUser.id,
            currentUser.displayName || currentUser.email,
            currentUser.role || 'user',
            'LOGIN',
            `เข้าสู่ระบบ: ${currentUser.displayName || currentUser.email}`,
            'Authentication',
            {
              severity: 'success',
              metadata: {
                userEmail: currentUser.email,
                userRole: currentUser.role,
                loginTime: new Date().toISOString()
              }
            }
          );
          console.log('📝 Login logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log login:', logError);
        }
      }
    } catch (error: any) {
      console.error('❌ AuthContext: Sign in error:', error);
      console.error('❌ AuthContext: Error code:', error.code);
      console.error('❌ AuthContext: Error message:', error.message);
      console.error('❌ AuthContext: Full error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // บันทึก logs การ logout ก่อนออกจากระบบ
      if (currentUser) {
        try {
          const { LogService } = await import('@/lib/logService');
          await LogService.log(
            currentUser.id,
            currentUser.displayName || currentUser.email,
            currentUser.role,
            'LOGOUT',
            `ออกจากระบบ: ${currentUser.displayName || currentUser.email}`,
            'Authentication',
            {
              resourceId: currentUser.id,
              severity: 'success',
              metadata: {
                userEmail: currentUser.email,
                userRole: currentUser.role,
                logoutTime: new Date().toISOString()
              }
            }
          );
          
          // Trigger log viewer refresh if on settings page
          const currentPath = window.location.pathname;
          if (currentPath.includes('/settings')) {
            window.dispatchEvent(new CustomEvent('logRefresh'));
          }
        } catch (logError) {
          console.error('Failed to log logout:', logError);
        }
      }
      
      await userService.signOut();
      setCurrentUser(null);
      setFirebaseUser(null);
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const logout = signOut;

  const extendSession = () => {
    setSessionWarning(false);
    setTimeRemaining(0);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    return userService.hasPermission(currentUser.role, permission);
  };

  const hasRole = (role: string): boolean => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid);
    }
  };

  const value: AuthContextType = {
    currentUser,
    user: currentUser,
    firebaseUser,
    isLoading,
    signIn,
    signOut,
    logout,
    hasPermission,
    hasRole,
    refreshUser,
    sessionWarning,
    timeRemaining,
    extendSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}