import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Mock error logging service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'anonymous' // In real app, get from auth context
    };

    // In production, send to error tracking service like Sentry
    console.error('Error logged:', errorData);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = async () => {
    const errorText = `
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      // Show success toast
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-red-200">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="flex items-center gap-3 text-red-800">
                <AlertTriangle className="h-6 w-6" />
                เกิดข้อผิดพลาดในระบบ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Error Message */}
              <Alert className="border-red-200 bg-red-50">
                <Bug className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ระบบพบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">รายละเอียดข้อผิดพลาด</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Error ID:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {this.state.errorId}
                    </code>
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-700 mb-2">Error Message:</h4>
                    <p className="text-sm text-red-600 font-mono break-words">
                      {this.state.error.message}
                    </p>
                    
                    {this.state.error.stack && (
                      <>
                        <h4 className="font-medium text-gray-700 mb-2 mt-4">Stack Trace:</h4>
                        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  ลองใหม่
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  กลับหน้าหลัก
                </Button>
                
                <Button
                  onClick={this.handleCopyError}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  คัดลอก Error ID
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมพัฒนา
                  <br />
                  พร้อมส่ง Error ID: <strong>{this.state.errorId}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
  const throwError = (error: Error) => {
    throw error;
  };

  return { throwError };
};