import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, User, Building2, TrendingUp, Package, Users, BarChart3, Eye, EyeOff, Mail, Shield, Sparkles, Zap } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const { signIn } = useAuth();

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  // Add focus animation
  const handleInputFocus = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        // Import Firebase auth for registration
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });

        setError('');
        setIsRegisterMode(false);
        setDisplayName('');
        setEmail('');
        setPassword('');
      } else {
        await signIn(email, password);
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('ไม่พบผู้ใช้นี้ในระบบ');
      } else if (error.code === 'auth/wrong-password') {
        setError('รหัสผ่านไม่ถูกต้อง');
      } else if (error.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (error.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else if (error.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-60 animate-pulse"></div>
            {/* Main logo */}
            <div className="relative w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            {/* Sparkle effects */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
            <Zap className="absolute -bottom-1 -left-1 w-4 h-4 text-blue-400 animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 tracking-tight">
            ระบบบริหารพัสดุ
          </h1>
          <p className="text-gray-300 text-lg font-medium">Advanced Inventory Management</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Secure • Fast • Reliable</span>
          </div>
        </div>

        {/* Login card */}
        <Card 
          ref={cardRef}
          className={`backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl transition-all duration-500 ${
            isAnimating ? 'scale-105 shadow-blue-500/25' : 'scale-100'
          }`}
        >
          <CardHeader className="text-center pb-6 relative">
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-t-lg blur-sm"></div>
            
            <div className="relative mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isRegisterMode ? 'Join our platform to get started' : 'Sign in to access your dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegisterMode && (
                <div className="space-y-3">
                  <Label htmlFor="displayName" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Display Name
                  </Label>
                  <div className="relative group">
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="Enter your full name"
                      required
                      disabled={loading}
                      className="pl-12 h-14 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                    className="pl-12 h-14 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Password
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="pl-12 pr-12 h-14 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-red-300 text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25 relative overflow-hidden group"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {loading ? (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isRegisterMode ? 'Creating Account...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 relative z-10">
                    <Shield className="w-5 h-5" />
                    <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Toggle between login and register */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setDisplayName('');
                }}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
              >
                {isRegisterMode 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          <div className="text-center group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-blue-400/20 group-hover:scale-110 transition-transform duration-300">
              <Package className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300 font-medium">Smart Inventory</p>
          </div>
          <div className="text-center group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-purple-400/20 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-sm text-gray-300 font-medium">Real-time Analytics</p>
          </div>
          <div className="text-center group">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-pink-400/20 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-pink-400" />
            </div>
            <p className="text-sm text-gray-300 font-medium">Team Management</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            © 2025 ระบบบริหารพัสดุ. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">System Online</span>
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* CSS for blob animation - moved to global CSS */}
    </div>
  );
}
