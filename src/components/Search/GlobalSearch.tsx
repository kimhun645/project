import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, ChevronDown, Package, Tag, Truck, RotateCcw, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearch } from '@/contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { AdvancedFilters } from './AdvancedFilters';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
}

export function GlobalSearch({ 
  className = '', 
  placeholder = 'ค้นหาทุกอย่างในระบบ...',
  showFilters = true 
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { state, search, setFilter, clearFilters, clearSearch, getSuggestions } = useSearch();
  const navigate = useNavigate();

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close advanced filters when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAdvancedFilters) {
        const filterModal = document.querySelector('[data-filter-modal]');
        if (filterModal && !filterModal.contains(event.target as Node)) {
          setShowAdvancedFilters(false);
        }
      }
    }

    if (showAdvancedFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvancedFilters]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < state.suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && state.suggestions[selectedSuggestion]) {
          handleSuggestionClick(state.suggestions[selectedSuggestion]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter('query', value);
    
    if (value.trim()) {
      getSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      clearSearch();
    }
  };

  const handleSearch = async () => {
    if (state.query.trim()) {
      await search(state.query);
      setIsOpen(true);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilter('query', suggestion);
    setShowSuggestions(false);
    search(suggestion);
    setIsOpen(true);
  };

  const handleResultClick = (type: string, id: string) => {
    switch (type) {
      case 'product':
        navigate(`/products?id=${id}`);
        break;
      case 'category':
        navigate(`/categories?id=${id}`);
        break;
      case 'supplier':
        navigate(`/suppliers?id=${id}`);
        break;
      case 'movement':
        navigate(`/movements?id=${id}`);
        break;
    }
    setIsOpen(false);
    clearSearch();
  };

  const getStockLevelColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'text-red-500';
    if (stock <= minStock) return 'text-orange-500';
    if (stock <= minStock * 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStockLevelText = (stock: number, minStock: number) => {
    if (stock === 0) return 'หมด';
    if (stock <= minStock) return 'ใกล้หมด';
    if (stock <= minStock * 2) return 'ปานกลาง';
    return 'เพียงพอ';
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input with 3D Effect */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm"></div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70 group-hover:text-white transition-colors duration-200">
            <Search className="h-5 w-5 drop-shadow-lg group-hover:scale-110 transition-transform duration-200" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={state.query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="pl-12 pr-20 h-12 rounded-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-sm border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:border-white/50 focus:bg-white/30 hover:bg-white/25 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {state.query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(true)}
                className="h-8 w-8 p-0 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && state.suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-white/30 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
          {state.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-4 py-3 hover:bg-white/20 cursor-pointer flex items-center transition-colors duration-150 rounded-lg ${
                index === selectedSuggestion ? 'bg-purple-100/50 border-l-4 border-purple-500' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Search className="h-4 w-4 text-purple-400 mr-3" />
              <span className="text-sm text-gray-700 font-medium">{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {isOpen && state.hasSearched && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-white/30 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-white/20 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">
                ผลการค้นหา ({state.totalResults} รายการ)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Products */}
            {state.results.products.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Package className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="font-medium text-sm text-gray-700">สินค้า ({state.results.products.length})</span>
                </div>
                <div className="space-y-3">
                  {state.results.products.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleResultClick('product', product.id)}
                      className="p-4 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900 mb-1">{product.name}</p>
                          <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">หมวดหมู่:</span>
                            <span className="text-xs font-medium text-purple-600">{product.category}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockLevelColor(product.current_stock, product.min_stock)}`}>
                            {getStockLevelText(product.current_stock, product.min_stock)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatNumber(product.current_stock)} ชิ้น</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {state.results.categories.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="font-medium text-sm text-gray-700">หมวดหมู่ ({state.results.categories.length})</span>
                </div>
                <div className="space-y-2">
                  {state.results.categories.slice(0, 3).map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleResultClick('category', category.id)}
                      className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-gray-500">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers */}
            {state.results.suppliers.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Truck className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium text-sm text-gray-700">ผู้จำหน่าย ({state.results.suppliers.length})</span>
                </div>
                <div className="space-y-2">
                  {state.results.suppliers.slice(0, 3).map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleResultClick('supplier', supplier.id)}
                      className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900">{supplier.name}</p>
                        {supplier.contact && (
                          <p className="text-xs text-gray-500">{supplier.contact}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movements */}
            {state.results.movements.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <RotateCcw className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="font-medium text-sm text-gray-700">การเคลื่อนไหว ({state.results.movements.length})</span>
                </div>
                <div className="space-y-2">
                  {state.results.movements.slice(0, 3).map((movement) => (
                    <div
                      key={movement.id}
                      onClick={() => handleResultClick('movement', movement.id)}
                      className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{movement.reason}</p>
                          <p className="text-xs text-gray-500">
                            {movement.type === 'IN' ? 'เข้า' : movement.type === 'OUT' ? 'ออก' : 'ปรับปรุง'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-900">
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(movement.created_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {state.totalResults === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ไม่พบผลการค้นหา</p>
                <p className="text-sm">ลองใช้คำค้นหาอื่น</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFilters 
        isOpen={showAdvancedFilters} 
        onClose={() => setShowAdvancedFilters(false)} 
      />
    </div>
  );
}