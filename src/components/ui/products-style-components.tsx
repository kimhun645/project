import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Grid3X3, 
  List, 
  CheckSquare, 
  Square, 
  MoreVertical, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Filter, 
  X, 
  Edit, 
  Trash2,
  Package,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { GlobalSearch } from '@/components/Search/GlobalSearch';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

// Types
export interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode | React.ComponentType<any>;
  color: 'purple' | 'orange' | 'red' | 'teal' | 'green';
  percentage?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  hidden?: boolean;
  render?: (value: any, row?: any) => React.ReactNode;
}

export interface PageLayoutProps {
  children: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  scannerDetected: boolean;
  actionButtons?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode[];
}

export interface StatsCardsProps {
  cards?: StatCard[];
  stats?: StatCard[]; // Support both prop names for backward compatibility
}

export interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onDelete: () => void;
}

export interface DataTableProps {
  title: string;
  description: string;
  data: any[];
  columns: TableColumn[];
  currentViewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onSort: (field: string) => void;
  onRefresh: () => void;
  onClearSelection: () => void;
  selectedItems: (string | number)[];
  onSelectItem: (id: string | number) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit?: (item: any) => void;
  onDelete: (id: string | number) => void;
  onFilter: () => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  loading: boolean;
  emptyMessage: string;
  filterDialog?: React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions: number[];
}

export interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
}

// Page Layout Component
export function ProductsStylePageLayout({ children }: PageLayoutProps) {
  return (
    <Layout hideHeader={true}>
      <div className="min-h-screen">
        <div className="w-full space-y-4 pb-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </Layout>
  );
}

// Page Header Component
export function ProductsStylePageHeader({
  title,
  description,
  icon: Icon,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onRefresh,
  scannerDetected,
  actionButtons,
  primaryAction,
  secondaryActions
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden mb-4 rounded-xl shadow-lg">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"></div>
      
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
      </div>
      
      {/* Main Header Content */}
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Title */}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              {Icon && (
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  {title}
                </h1>
                {description && (
                  <p className="text-white/80 text-sm mt-1">{description}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Side - Search and Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="w-80">
              <GlobalSearch 
                className="w-full" 
                placeholder={searchPlaceholder}
                showFilters={true}
                value={searchValue}
                onChange={onSearchChange}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                className="h-9 px-3 rounded-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* Secondary Actions */}
              {secondaryActions && secondaryActions.map((action, index) => (
                <div key={index}>{action}</div>
              ))}
              
              {/* Primary Action */}
              {primaryAction}
              
              {/* Legacy Action Buttons */}
              {actionButtons}
            </div>
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-white/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">ระบบบริหารพัสดุ</span>
              </div>
              <div className="w-px h-3 bg-white/30"></div>
              <span>อัปเดต: {new Date().toLocaleTimeString('th-TH')}</span>
            </div>
            <div className="flex items-center gap-3">
              <BarcodeScannerIndicator isDetected={scannerDetected} />
              {scannerDetected && (
                <span className="text-xs text-green-100 bg-green-500/20 px-2 py-1 rounded-full">
                  สแกนพร้อม
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Stats Cards Component
export function ProductsStyleStatsCards({ cards, stats }: StatsCardsProps) {
  // Support both prop names for backward compatibility
  const cardsData = cards || stats || [];
  
  // Early return if no data
  if (!cardsData || cardsData.length === 0) {
    return null;
  }
  const getCardStyles = (color: StatCard['color']) => {
    const styles = {
      purple: {
        gradient: 'from-purple-500/10 via-indigo-500/5',
        circle1: 'from-purple-400/30 to-indigo-400/30',
        circle2: 'from-purple-300/20 to-indigo-300/20',
        iconBg: 'from-purple-500 to-indigo-600',
        iconShadow: 'shadow-purple-500/30',
        hoverShadow: 'hover:shadow-purple-500/20',
        percentageColor: 'text-purple-500',
        percentageBg: 'bg-purple-50'
      },
      orange: {
        gradient: 'from-orange-500/10 via-amber-500/5',
        circle1: 'from-orange-400/30 to-amber-400/30',
        circle2: 'from-orange-300/20 to-amber-300/20',
        iconBg: 'from-orange-500 to-amber-600',
        iconShadow: 'shadow-orange-500/30',
        hoverShadow: 'hover:shadow-orange-500/20',
        percentageColor: 'text-orange-500',
        percentageBg: 'bg-orange-50'
      },
      red: {
        gradient: 'from-red-500/10 via-pink-500/5',
        circle1: 'from-red-400/30 to-pink-400/30',
        circle2: 'from-red-300/20 to-pink-300/20',
        iconBg: 'from-red-500 to-pink-600',
        iconShadow: 'shadow-red-500/30',
        hoverShadow: 'hover:shadow-red-500/20',
        percentageColor: 'text-red-500',
        percentageBg: 'bg-red-50'
      },
      teal: {
        gradient: 'from-teal-500/10 via-cyan-500/5',
        circle1: 'from-teal-400/30 to-cyan-400/30',
        circle2: 'from-teal-300/20 to-cyan-300/20',
        iconBg: 'from-teal-500 to-cyan-600',
        iconShadow: 'shadow-teal-500/30',
        hoverShadow: 'hover:shadow-teal-500/20',
        percentageColor: 'text-teal-500',
        percentageBg: 'bg-teal-50'
      },
      green: {
        gradient: 'from-green-500/10 via-emerald-500/5',
        circle1: 'from-green-400/30 to-emerald-400/30',
        circle2: 'from-green-300/20 to-emerald-300/20',
        iconBg: 'from-green-500 to-emerald-600',
        iconShadow: 'shadow-green-500/30',
        hoverShadow: 'hover:shadow-green-500/20',
        percentageColor: 'text-green-500',
        percentageBg: 'bg-green-50'
      },
      blue: {
        gradient: 'from-blue-500/10 via-cyan-500/5',
        circle1: 'from-blue-400/30 to-cyan-400/30',
        circle2: 'from-blue-300/20 to-cyan-300/20',
        iconBg: 'from-blue-500 to-cyan-600',
        iconShadow: 'shadow-blue-500/30',
        hoverShadow: 'hover:shadow-blue-500/20',
        percentageColor: 'text-blue-500',
        percentageBg: 'bg-blue-50'
      },
      yellow: {
        gradient: 'from-yellow-500/10 via-amber-500/5',
        circle1: 'from-yellow-400/30 to-amber-400/30',
        circle2: 'from-yellow-300/20 to-amber-300/20',
        iconBg: 'from-yellow-500 to-amber-600',
        iconShadow: 'shadow-yellow-500/30',
        hoverShadow: 'hover:shadow-yellow-500/20',
        percentageColor: 'text-yellow-500',
        percentageBg: 'bg-yellow-50'
      }
    };
    return styles[color] || styles.purple; // Fallback to purple if color not found
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mx-0">
      {cardsData.map((card, index) => {
        const styles = getCardStyles(card.color);
        return (
          <Card key={index} className={`group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl ${styles.hoverShadow} transition-all duration-500 hover:-translate-y-3 hover:scale-105 transform`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.circle1} rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.circle2} rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md`}></div>
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className={`relative p-4 bg-gradient-to-br ${styles.iconBg} text-white rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg ${styles.iconShadow}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <div className="relative h-6 w-6 drop-shadow-lg">
                  {typeof card.icon === 'function' ? <card.icon className="h-6 w-6" /> : card.icon}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-sm"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 drop-shadow-sm">{card.value}</p>
              </div>
              {card.percentage && (
                <div className={`text-sm font-semibold ${styles.percentageColor} flex items-center ${styles.percentageBg} px-3 py-1 rounded-full`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {card.percentage}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

// Bulk Actions Bar Component
export function ProductsStyleBulkActionsBar({
  selectedCount,
  onClear,
  onCopy,
  onExport,
  onDelete
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-1 transform mb-4 mx-0">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-600" />
              <span className="text-lg font-semibold text-gray-700">
                เลือกแล้ว {selectedCount} รายการ
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-8 px-3 rounded-xl border-orange-200 hover:bg-orange-50 hover:border-orange-300"
            >
              <X className="h-4 w-4 mr-1" />
              ยกเลิก
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {onCopy && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                className="h-8 px-3 rounded-xl border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <Copy className="h-4 w-4 mr-1" />
                คัดลอก
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8 px-3 rounded-xl border-green-200 hover:bg-green-50 hover:border-green-300"
              >
                <Download className="h-4 w-4 mr-1" />
                ส่งออก
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              ลบทั้งหมด
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Delete Confirmation Dialog Component
export function ProductsStyleDeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemName
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-white to-red-50 shadow-2xl border-0 rounded-2xl backdrop-blur-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-red-800">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            คุณแน่ใจหรือไม่ที่จะลบ{itemName}? 
            <br />
            <span className="text-destructive font-medium">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-2 border-red-200 hover:bg-red-50 rounded-2xl transition-all duration-300 hover:scale-105 transform">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-red-500/30"
          >
            ลบ{itemName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
