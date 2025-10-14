import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-red-200">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-red-800">
                เกิดข้อผิดพลาดในการแสดงผล
              </h3>
              <p className="text-red-600 max-w-md">
                อาจมี object ถูกเรนเดอร์เป็นข้อความ หรือข้อมูลไม่ถูกต้อง
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-100 p-4 rounded-lg max-w-2xl">
                <summary className="cursor-pointer font-medium text-red-800 mb-2">
                  รายละเอียดข้อผิดพลาด (Development)
                </summary>
                <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                ลองใหม่
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 px-6 py-2 rounded-lg"
              >
                รีเฟรชหน้า
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default fallback component
export const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="p-4 border rounded-lg bg-red-50 border-red-200">
    <h3 className="font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h3>
    <p className="text-red-600 mb-3">
      เกิดข้อผิดพลาดในการแสดงผล (อาจมี object ถูกเรนเดอร์เป็นข้อความ)
    </p>
    <Button onClick={retry} className="bg-red-600 hover:bg-red-700 text-white">
      ลองใหม่
    </Button>
  </div>
);
