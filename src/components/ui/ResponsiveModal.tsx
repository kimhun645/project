import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'default' | 'colorful' | 'professional' | 'minimal';
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[600px]',
  xl: 'sm:max-w-[700px]',
  '2xl': 'sm:max-w-[800px]',
  full: 'sm:max-w-[95vw]',
};

const variantStyles = {
  default: {
    background: 'bg-gradient-to-br from-slate-50 via-white to-gray-50',
    border: 'border-slate-200',
    header: 'bg-white border-slate-200',
    footer: 'bg-white border-slate-200',
    accent: 'border-slate-200/60',
  },
  colorful: {
    background: 'bg-gradient-to-br from-pink-50 via-yellow-50 to-cyan-50',
    border: 'border-pink-200',
    header: 'bg-gradient-to-r from-white/95 to-pink-50/95 backdrop-blur-sm border-pink-200/60',
    footer: 'bg-gradient-to-r from-pink-50/95 to-white/95 backdrop-blur-sm border-pink-200/60',
    accent: 'border-pink-200/60',
  },
  professional: {
    background: 'bg-white',
    border: 'border-slate-200',
    header: 'bg-white border-slate-200',
    footer: 'bg-white border-slate-200',
    accent: 'border-slate-200',
  },
  minimal: {
    background: 'bg-white',
    border: 'border-gray-100',
    header: 'bg-gray-50 border-gray-100',
    footer: 'bg-gray-50 border-gray-100',
    accent: 'border-gray-100',
  },
};

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  trigger,
  size = 'lg',
  variant = 'default',
  showCloseButton = true,
  className = '',
}: ResponsiveModalProps) {
  const sizeClass = sizeClasses[size];
  const variantStyle = variantStyles[variant];

  const renderBackgroundElements = () => {
    if (variant === 'colorful') {
      return (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-yellow-50 to-cyan-50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/30 via-transparent to-green-100/30"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-100/20 via-transparent to-pink-100/20"></div>
          
          {/* Colorful Accent Lines */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-yellow-400 via-green-400 to-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-400 via-pink-400 to-yellow-400"></div>
          
          {/* Vibrant Corner Accents */}
          <div className="absolute top-4 right-4 w-3 h-3 bg-pink-400 rounded-full shadow-lg"></div>
          <div className="absolute top-4 right-10 w-2 h-2 bg-yellow-400 rounded-full shadow-md"></div>
          <div className="absolute top-4 right-16 w-1 h-1 bg-green-400 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-cyan-400 rounded-full shadow-lg"></div>
          <div className="absolute bottom-4 left-10 w-2 h-2 bg-purple-400 rounded-full shadow-md"></div>
          <div className="absolute bottom-4 left-16 w-1 h-1 bg-orange-400 rounded-full"></div>
          
          {/* Floating Colorful Elements */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-pink-200/40 to-yellow-200/40 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-gradient-to-br from-green-200/40 to-cyan-200/40 rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-14 h-14 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full"></div>
          <div className="absolute bottom-1/3 left-1/3 w-10 h-10 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full"></div>
        </>
      );
    }

    if (variant === 'professional') {
      return (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-50"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Subtle Accent Lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
          
          {/* Professional Corner Accents */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
          <div className="absolute top-4 right-8 w-1 h-1 bg-indigo-500 rounded-full opacity-40"></div>
          <div className="absolute bottom-4 left-4 w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
          <div className="absolute bottom-4 left-8 w-1 h-1 bg-indigo-500 rounded-full opacity-40"></div>
        </>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={`${sizeClass} w-[95vw] max-h-[90vh] ${variantStyle.background} shadow-2xl border ${variantStyle.border} rounded-2xl relative overflow-hidden p-0 ${className}`}
      >
        {renderBackgroundElements()}
        
        <DialogHeader className={`relative z-20 pb-4 px-6 pt-6 border-b ${variantStyle.accent} ${variantStyle.header}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  {icon}
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-sm text-slate-600 font-medium mt-1">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
            {showCloseButton && (
              <DialogClose className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-2 transition-all duration-200 hover:scale-110 z-30 relative -mr-2 -mt-2">
                <X className="h-5 w-5" />
              </DialogClose>
            )}
          </div>
        </DialogHeader>
        
        <div className="relative z-10 max-h-[calc(90vh-120px)] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
