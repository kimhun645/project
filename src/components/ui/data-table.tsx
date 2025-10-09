import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Filter, 
  X, 
  RefreshCw, 
  Grid3X3, 
  List, 
  CheckSquare, 
  Square,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  hidden?: boolean;
}


interface DataTableProps {
  title: string;
  description: string;
  data: any[];
  columns: TableColumn[];
  currentViewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRefresh?: () => void;
  onFilter?: () => void;
  onSortFieldChange?: (field: string) => void;
  onClearSelection?: () => void;
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  onSelectAll?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onMore?: (item: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}


// Helper function to get sort field labels
const getSortFieldLabel = (field: string): string => {
  const fieldLabels: { [key: string]: string } = {
    'name': 'ชื่อ',
    'sku': 'SKU',
    'current_stock': 'สต็อก',
    'unit_price': 'ราคา',
    'created_at': 'วันที่',
    'product_name': 'ชื่อสินค้า',
    'product_sku': 'SKU',
    'type': 'ประเภท',
    'quantity': 'จำนวน',
    'reason': 'เหตุผล',
    'reference': 'เลขที่อ้างอิง'
  };
  return fieldLabels[field] || field;
};

export function DataTable({
  title,
  description,
  data,
  columns,
  currentViewMode = 'table',
  onViewModeChange,
  onSort,
  onRefresh,
  onFilter,
  onSortFieldChange,
  onClearSelection,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  onEdit,
  onDelete,
  onMore,
  loading = false,
  emptyMessage = "ไม่พบข้อมูลที่ตรงกับการค้นหา",
  className = "",
  sortField,
  sortDirection = 'asc'
}: DataTableProps) {
  const [internalSortField, setInternalSortField] = useState<string>(sortField || '');
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>(sortDirection || 'asc');

  const handleSort = (field: string) => {
    if (onSort) {
      const newDirection = internalSortField === field && internalSortDirection === 'asc' ? 'desc' : 'asc';
      setInternalSortField(field);
      setInternalSortDirection(newDirection);
      onSort(field, newDirection);
    }
    if (onSortFieldChange) {
      onSortFieldChange(field);
    }
  };

  const visibleColumns = columns.filter(col => !col.hidden);
  const allSelected = selectedItems.length === data.length && data.length > 0;

  return (
    <Card className={`group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 transform mx-0 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/10 to-indigo-300/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md"></div>
      
      <CardHeader className="pb-6 relative z-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white rounded-t-2xl -m-6 mb-6 p-8 shadow-lg">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          {/* Left Side - Title and Stats */}
          <div className="flex-1 space-y-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
              <div className="relative p-3 bg-white/20 rounded-2xl mr-4 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
              </div>
              <div>
                <div className="relative">
                  <span className="relative z-10">{title}</span>
                  <div className="absolute inset-0 text-white/20 blur-sm transform translate-x-1 translate-y-1">
                    {title}
                  </div>
                </div>
                <p className="text-sm text-white/80 font-medium mt-1">
                  {description}
                </p>
              </div>
            </CardTitle>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white/90">
                  {data.length} รายการ
                </span>
              </div>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-orange-400/30">
                  <CheckSquare className="w-4 h-4 text-orange-200" />
                  <span className="text-sm font-medium text-orange-100">
                    เลือก {selectedItems.length} รายการ
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side - Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            
            
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-2xl p-1 border border-white/30">
                <Button
                  variant={currentViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange?.('table')}
                  className={`h-9 px-4 rounded-xl transition-all duration-300 ${
                    currentViewMode === 'table' 
                      ? 'bg-white text-purple-600 shadow-lg' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  ตาราง
                </Button>
                <Button
                  variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange?.('grid')}
                  className={`h-9 px-4 rounded-xl transition-all duration-300 ${
                    currentViewMode === 'grid' 
                      ? 'bg-white text-purple-600 shadow-lg' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  กริด
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                disabled={selectedItems.length === 0}
                className="h-9 px-3 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4 mr-1" />
                ล้าง
              </Button>
              
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="h-9 px-3 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  รีเฟรช
                </Button>
              )}
              

              {/* Sort Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Cycle through sortable columns
                  const sortableColumns = columns.filter(col => col.sortable);
                  if (sortableColumns.length === 0) return;
                  
                  const currentField = sortField || internalSortField;
                  const currentIndex = sortableColumns.findIndex(col => col.key === currentField);
                  const nextIndex = (currentIndex + 1) % sortableColumns.length;
                  const nextField = sortableColumns[nextIndex].key;
                  
                  handleSort(nextField);
                }}
                className="h-9 px-3 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                เรียงตาม: {getSortFieldLabel(sortField || internalSortField)} ({(sortDirection || internalSortDirection) === 'asc' ? 'A-Z' : 'Z-A'})
              </Button>

              {/* Filter Button */}
              {onFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFilter}
                  className="h-9 px-3 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  กรอง
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 sm:p-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="ml-3 text-lg font-medium">กำลังโหลดข้อมูล...</span>
          </div>
        ) : currentViewMode === 'table' ? (
          <div className="overflow-x-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-inner w-full">
            <Table className="w-full min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 hover:from-purple-100 hover:via-indigo-100 hover:to-blue-100 transition-all duration-300 border-b-2 border-purple-200">
                  {onSelectAll && (
                    <TableHead className="w-12 py-4 pl-6">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onSelectAll}
                          className="h-7 w-7 p-0 hover:bg-purple-100 rounded-xl transition-all duration-200 hover:scale-110"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Square className="h-4 w-4 text-purple-600" />
                          )}
                        </Button>
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={`text-sm font-semibold py-3 text-purple-700 ${column.sortable ? 'cursor-pointer hover:bg-purple-100/50 transition-all duration-200 hover:scale-105 group' : ''} ${column.className || ''}`}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center gap-2 group-hover:text-purple-800">
                        <span>{column.title}</span>
                        {column.sortable && (
                          <ArrowUpDown className="h-4 w-4 group-hover:text-purple-600 transition-colors duration-200" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {(onEdit || onDelete || onMore) && (
                    <TableHead className="text-sm font-semibold py-3 text-purple-700 pr-6">
                      <div className="flex items-center gap-2">
                        <MoreVertical className="h-4 w-4 text-purple-500" />
                        <span>การจัดการ</span>
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + (onSelectAll ? 1 : 0) + ((onEdit || onDelete || onMore) ? 1 : 0)} className="text-center py-12 text-muted-foreground text-lg font-medium bg-gray-50/50">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => (
                    <TableRow 
                      key={row.id || index}
                      className={`hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-300 card-entrance animate-delay-${(index % 5 + 1) * 100} ${
                        index % 2 === 0 ? 'bg-white/60' : 'bg-purple-50/30'
                      } ${selectedItems.includes(row.id) ? 'bg-purple-100/50 ring-1 ring-purple-300' : ''} group`}
                    >
                      {onSelectItem && (
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectItem(row.id)}
                              className="h-7 w-7 p-0 hover:bg-purple-100 rounded-xl transition-all duration-200 hover:scale-110"
                            >
                              {selectedItems.includes(row.id) ? (
                                <CheckSquare className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Square className="h-4 w-4 text-purple-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} className={`text-base sm:text-lg py-4 ${column.className || ''}`}>
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </TableCell>
                      ))}
                      {(onEdit || onDelete || onMore) && (
                        <TableCell className="py-4 pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            {onEdit && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onEdit(row)}
                                className="group relative h-10 w-10 hover:bg-purple-50 hover:text-purple-600 transition-all duration-300 hover:scale-110 transform rounded-xl border border-transparent hover:border-purple-200"
                                title="แก้ไข"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Edit className="relative h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="group relative text-destructive hover:text-destructive h-10 w-10 hover:bg-red-50 transition-all duration-300 hover:scale-110 transform rounded-xl border border-transparent hover:border-red-200"
                                onClick={() => onDelete(row)}
                                title="ลบ"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Trash2 className="relative h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                              </Button>
                            )}
                            {onMore && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="group relative h-10 w-10 hover:bg-gray-50 hover:text-gray-600 transition-all duration-300 hover:scale-110 transform rounded-xl border border-transparent hover:border-gray-200"
                                onClick={() => onMore(row)}
                                title="ตัวเลือกเพิ่มเติม"
                              >
                                <MoreVertical className="relative h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {data.map((row, index) => (
              <Card 
                key={row.id || index}
                className={`group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 hover:scale-105 transform cursor-pointer ${
                  selectedItems.includes(row.id) ? 'ring-2 ring-purple-500 bg-purple-50/50' : ''
                }`}
                onClick={() => onSelectItem?.(row.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardContent className="p-4 relative z-10">
                  <div className="space-y-3">
                    {visibleColumns.map((column) => (
                      <div key={column.key} className={column.className}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </div>
                    ))}
                    
                    {(onEdit || onDelete || onMore) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row);
                              }}
                              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {onMore && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMore(row);
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
