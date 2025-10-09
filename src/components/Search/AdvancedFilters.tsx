import React, { useState } from 'react';
import { X, Filter, Calendar, Package, Tag, Truck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/contexts/SearchContext';
import { useStock } from '@/contexts/StockContext';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedFilters({ isOpen, onClose }: AdvancedFiltersProps) {
  const { state, setFilter, clearFilters, search } = useSearch();
  const { categories, suppliers } = useStock();
  const [localFilters, setLocalFilters] = useState(state.filters);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    Object.entries(localFilters).forEach(([key, value]) => {
      setFilter(key, value);
    });
    onClose();
    // Trigger search with new filters
    if (state.query.trim()) {
      search();
    }
  };

  const handleClearFilters = () => {
    setLocalFilters({
      category: undefined,
      supplier: undefined,
      stockLevel: 'all',
      dateRange: undefined,
      type: 'all'
    });
    clearFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.category) count++;
    if (localFilters.supplier) count++;
    if (localFilters.stockLevel !== 'all') count++;
    if (localFilters.dateRange) count++;
    if (localFilters.type !== 'all') count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-filter-modal>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-purple-500" />
            ตัวกรองขั้นสูง
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ประเภทการค้นหา
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'all', label: 'ทั้งหมด', icon: Package },
                { value: 'products', label: 'สินค้า', icon: Package },
                { value: 'categories', label: 'หมวดหมู่', icon: Tag },
                { value: 'suppliers', label: 'ผู้จำหน่าย', icon: Truck }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={localFilters.type === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('type', value)}
                  className="justify-start"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              หมวดหมู่
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                variant={!localFilters.category ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('category', undefined)}
              >
                ทั้งหมด
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={localFilters.category === category.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('category', category.name)}
                  className="justify-start"
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ผู้จำหน่าย
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant={!localFilters.supplier ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('supplier', undefined)}
              >
                ทั้งหมด
              </Button>
              {suppliers.map((supplier) => (
                <Button
                  key={supplier.id}
                  variant={localFilters.supplier === supplier.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('supplier', supplier.name)}
                  className="justify-start"
                >
                  {supplier.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Stock Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ระดับสต็อก
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'all', label: 'ทั้งหมด', color: 'gray' },
                { value: 'high', label: 'เพียงพอ', color: 'green' },
                { value: 'medium', label: 'ปานกลาง', color: 'yellow' },
                { value: 'low', label: 'ใกล้หมด', color: 'orange' },
                { value: 'out', label: 'หมด', color: 'red' }
              ].map(({ value, label, color }) => (
                <Button
                  key={value}
                  variant={localFilters.stockLevel === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('stockLevel', value)}
                  className={`justify-start ${
                    localFilters.stockLevel === value 
                      ? `bg-${color}-500 hover:bg-${color}-600` 
                      : ''
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ช่วงวันที่
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={localFilters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...localFilters.dateRange,
                    start: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={localFilters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...localFilters.dateRange,
                    end: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ตัวกรองที่ใช้งาน ({getActiveFiltersCount()})
              </label>
              <div className="flex flex-wrap gap-2">
                {localFilters.category && (
                  <Badge variant="secondary" className="flex items-center">
                    หมวดหมู่: {localFilters.category}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleFilterChange('category', undefined)}
                    />
                  </Badge>
                )}
                {localFilters.supplier && (
                  <Badge variant="secondary" className="flex items-center">
                    ผู้จำหน่าย: {localFilters.supplier}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleFilterChange('supplier', undefined)}
                    />
                  </Badge>
                )}
                {localFilters.stockLevel !== 'all' && (
                  <Badge variant="secondary" className="flex items-center">
                    สต็อก: {localFilters.stockLevel}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleFilterChange('stockLevel', 'all')}
                    />
                  </Badge>
                )}
                {localFilters.type !== 'all' && (
                  <Badge variant="secondary" className="flex items-center">
                    ประเภท: {localFilters.type}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleFilterChange('type', 'all')}
                    />
                  </Badge>
                )}
                {localFilters.dateRange && (
                  <Badge variant="secondary" className="flex items-center">
                    วันที่: {localFilters.dateRange.start} - {localFilters.dateRange.end}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleFilterChange('dateRange', undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleClearFilters}>
              ล้างทั้งหมด
            </Button>
            <Button onClick={handleApplyFilters}>
              ใช้ตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
