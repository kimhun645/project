import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirecting to dashboard
    // เปลี่ยนไปหน้า Dashboard โดยตรง
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">กำลังเปลี่ยนไปหน้า Dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
