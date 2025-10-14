import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, Grid3x3 as Grid3X3, List, CheckSquare, Square, MoreVertical, ArrowUpDown, Filter, X, FileEdit as Edit, Trash2, Package } from 'lucide-react';
import { TableColumn } from './products-style-components';
import { TableSkeleton, GridSkeleton } from './loading-skeleton';

export interface ProductsStyleDataTableProps {
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
  getItemId: (item: any) => string | number;
  getItemName?: (item: any) => string;
  currentPage?: number;
  totalPages?: number;
}

export function ProductsStyleDataTable({
  title,
  description,
  data,
  columns,
  currentViewMode,
  onViewModeChange,
  onSort,
  onRefresh,
  onClearSelection,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onEdit,
  onDelete,
  onFilter,
  sortField,
  sortDirection,
  loading,
  emptyMessage,
  filterDialog,
  getItemId,
  getItemName,
  currentPage = 1,
  totalPages = 1
}: ProductsStyleDataTableProps) {
  const visibleColumns = columns.filter(col => !col.hidden);
  const allSelected = data.length > 0 && selectedItems.length === data.length;

  // Table View
  const TableView = () => (
    <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 transform mx-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/10 to-indigo-300/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md"></div>
      
      <CardHeader className="relative overflow-hidden rounded-t-2xl -m-6 mb-4 p-0 shadow-lg">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
        </div>
        
        {/* Main Header Content */}
        <div className="relative z-10 px-8 py-5">
          {/* Top Row - Title and Primary Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">
                  {title}
                </h1>
                <p className="text-white/70 text-xs mt-0.5">
                  {description}
                </p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/30">
              <Button
                variant={currentViewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('table')}
                className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                  currentViewMode === 'table' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <List className="h-3 w-3 mr-1.5" />
                ตาราง
              </Button>
              <Button
                variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                  currentViewMode === 'grid' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Grid3X3 className="h-3 w-3 mr-1.5" />
                กริด
              </Button>
            </div>
          </div>
          
          {/* Bottom Row - Stats and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Left Side - Stats */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/90">
                  {data.length} รายการ
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/90">
                  หน้า {currentPage} จาก {totalPages}
                </span>
              </div>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-1.5 bg-orange-500/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-orange-400/30">
                  <CheckSquare className="w-3 h-3 text-orange-200" />
                  <span className="text-xs font-medium text-orange-100">
                    เลือก {selectedItems.length} รายการ
                  </span>
                </div>
              )}
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Info */}
              <div className="hidden lg:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <ArrowUpDown className="w-3 h-3 text-white/70" />
                <span className="text-xs text-white/80">
                  เรียงตาม: {sortField}
                </span>
                <span className="text-xs text-white/60">
                  ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  disabled={selectedItems.length === 0}
                  className="h-8 px-2 rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-3 h-3 mr-1" />
                  ล้าง
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="h-8 px-2 rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  รีเฟรช
                </Button>
                
                {filterDialog && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                      >
                        <Filter className="w-3 h-3 mr-1" />
                        กรอง
                      </Button>
                    </DialogTrigger>
                    {filterDialog}
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 sm:p-6 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="ml-3 text-lg font-medium">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-inner w-full">
            <Table className="w-full min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 hover:from-purple-100 hover:via-indigo-100 hover:to-blue-100 transition-all duration-300 border-b-2 border-purple-200">
                  <TableHead className="w-12 py-4 pl-6">
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectAll(!allSelected)}
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
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={`text-sm font-semibold py-3 text-purple-700 ${
                        column.sortable ? 'cursor-pointer hover:bg-purple-100/50 transition-all duration-200 hover:scale-105 group' : ''
                      }`}
                      onClick={column.sortable ? () => onSort(column.key) : undefined}
                    >
                      <div className="flex items-center gap-2 group-hover:text-purple-800">
                        <span>{column.title}</span>
                        {column.sortable && (
                          <ArrowUpDown className="h-4 w-4 group-hover:text-purple-600 transition-colors duration-200" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center py-12 text-muted-foreground text-lg font-medium bg-gray-50/50">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    if (!item) return null; // Skip undefined items
                    const itemId = getItemId(item);
                    const isSelected = selectedItems.includes(itemId);
                    
                    return (
                      <TableRow 
                        key={itemId} 
                        className={`hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-300 ${
                          index % 2 === 0 ? 'bg-white/60' : 'bg-purple-50/30'
                        } ${isSelected ? 'bg-purple-100/50 ring-1 ring-purple-300' : ''} group`}
                      >
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectItem(itemId)}
                              className="h-7 w-7 p-0 hover:bg-purple-100 rounded-xl transition-all duration-200 hover:scale-110"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Square className="h-4 w-4 text-purple-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        {visibleColumns.map((column) => {
                          const cellValue = item ? item[column.key] : null;
                          const displayValue = cellValue != null ? String(cellValue) : '-';
                          
                          return (
                            <TableCell key={column.key} className="font-bold text-base sm:text-lg py-4">
                              {column.render && item ? column.render(cellValue, item) : displayValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Grid View
  const GridView = () => (
    <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 transform mx-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="relative overflow-hidden rounded-t-2xl -m-6 mb-4 p-0 shadow-lg">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
        </div>
        
        {/* Main Header Content */}
        <div className="relative z-10 px-8 py-5">
          {/* Top Row - Title and Primary Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
                  <Grid3X3 className="h-5 w-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">
                  มุมมองกริด
                </h1>
                <p className="text-white/70 text-xs mt-0.5">
                  ดูข้อมูลในรูปแบบการ์ด
                </p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/30">
              <Button
                variant={currentViewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('table')}
                className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                  currentViewMode === 'table' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <List className="h-3 w-3 mr-1.5" />
                ตาราง
              </Button>
              <Button
                variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                  currentViewMode === 'grid' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Grid3X3 className="h-3 w-3 mr-1.5" />
                กริด
              </Button>
            </div>
          </div>
          
          {/* Bottom Row - Stats and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Left Side - Stats */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/90">
                  {data.length} รายการ
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/90">
                  หน้า {currentPage} จาก {totalPages}
                </span>
              </div>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-1.5 bg-orange-500/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-orange-400/30">
                  <CheckSquare className="w-3 h-3 text-orange-200" />
                  <span className="text-xs font-medium text-orange-100">
                    เลือก {selectedItems.length} รายการ
                  </span>
                </div>
              )}
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Info */}
              <div className="hidden lg:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Grid3X3 className="w-3 h-3 text-white/70" />
                <span className="text-xs text-white/80">
                  มุมมองการ์ด
                </span>
                <span className="text-xs text-white/60">
                  ({data.length} รายการ)
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  disabled={selectedItems.length === 0}
                  className="h-8 px-2 rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-3 h-3 mr-1" />
                  ล้าง
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="h-8 px-2 rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  รีเฟรช
                </Button>
                
                {filterDialog && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                      >
                        <Filter className="w-3 h-3 mr-1" />
                        กรอง
                      </Button>
                    </DialogTrigger>
                    {filterDialog}
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="ml-3 text-lg font-medium">กำลังโหลดข้อมูล...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-lg font-medium">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((item, index) => {
              if (!item) return null; // Skip undefined items
              const itemId = getItemId(item);
              const isSelected = selectedItems.includes(itemId);
              const itemName = getItemName ? getItemName(item) : `รายการ ${index + 1}`;
              
              return (
                <Card 
                  key={itemId}
                  className={`group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 hover:scale-105 transform cursor-pointer ${
                    isSelected ? 'ring-2 ring-purple-500 bg-purple-50/50' : ''
                  }`}
                  onClick={() => onSelectItem(itemId)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Item Image Placeholder */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-t-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-16 w-16 text-purple-400" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(itemId);
                        }}
                        className="h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Square className="h-4 w-4 text-purple-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 relative z-10">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-1" title={itemName}>
                          {itemName}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        {visibleColumns.slice(0, 3).map((column) => {
                          const cellValue = item ? item[column.key] : null;
                          const displayValue = cellValue != null ? String(cellValue) : '-';
                          const renderedValue = column.render ? column.render(cellValue, item) : displayValue;
                          return (
                            <div key={column.key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{column.title}:</span>
                              <span className="text-sm font-medium">
                                {renderedValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Show loading skeleton when loading
  if (loading) {
    return currentViewMode === 'table' ? <TableSkeleton /> : <GridSkeleton />;
  }

  return currentViewMode === 'table' ? <TableView /> : <GridView />;
}

// ProductsStyleDataTable is already exported in function declaration above
export type { ProductsStyleDataTableProps };
