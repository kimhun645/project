import React, { useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Tag, 
  Truck, 
  RotateCcw, 
  Search, 
  ArrowLeft,
  AlertTriangle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function SearchResults() {
  const { state, search, clearSearch } = useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.query && !state.hasSearched) {
      navigate('/dashboard');
    }
  }, [state.query, state.hasSearched, navigate]);

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
  };

  const getStockLevelColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'text-red-500 bg-red-50';
    if (stock <= minStock) return 'text-orange-500 bg-orange-50';
    if (stock <= minStock * 2) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  const getStockLevelText = (stock: number, minStock: number) => {
    if (stock === 0) return 'หมด';
    if (stock <= minStock) return 'ใกล้หมด';
    if (stock <= minStock * 2) return 'ปานกลาง';
    return 'เพียงพอ';
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return 'text-green-600 bg-green-50';
      case 'OUT': return 'text-red-600 bg-red-50';
      case 'ADJUSTMENT': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'IN': return 'เข้า';
      case 'OUT': return 'ออก';
      case 'ADJUSTMENT': return 'ปรับปรุง';
      default: return type;
    }
  };

  if (!state.hasSearched) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบผลการค้นหา</h2>
          <p className="text-gray-500 mb-4">ลองใช้คำค้นหาอื่นหรือปรับตัวกรอง</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปแดชบอร์ด
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ผลการค้นหา
              </h1>
              <p className="text-gray-600">
                ค้นหา: <span className="font-semibold">"{state.query}"</span> 
                ({state.totalResults} รายการ)
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </div>

          {/* Active Filters */}
          {(state.filters.category || state.filters.supplier || state.filters.stockLevel !== 'all' || state.filters.type !== 'all') && (
            <div className="flex flex-wrap gap-2">
              {state.filters.category && (
                <Badge variant="secondary" className="flex items-center">
                  หมวดหมู่: {state.filters.category}
                </Badge>
              )}
              {state.filters.supplier && (
                <Badge variant="secondary" className="flex items-center">
                  ผู้จำหน่าย: {state.filters.supplier}
                </Badge>
              )}
              {state.filters.stockLevel !== 'all' && (
                <Badge variant="secondary" className="flex items-center">
                  สต็อก: {state.filters.stockLevel}
                </Badge>
              )}
              {state.filters.type !== 'all' && (
                <Badge variant="secondary" className="flex items-center">
                  ประเภท: {state.filters.type}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-8">
          {/* Products */}
          {state.results.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 text-purple-500 mr-2" />
                  สินค้า ({state.results.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.results.products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleResultClick('product', product.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 hover:border-purple-300"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                        <Badge className={getStockLevelColor(product.current_stock, product.min_stock)}>
                          {getStockLevelText(product.current_stock, product.min_stock)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">สต็อก: {formatNumber(product.current_stock)}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(product.unit_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {state.results.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 text-blue-500 mr-2" />
                  หมวดหมู่ ({state.results.categories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.results.categories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleResultClick('category', category.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 hover:border-blue-300"
                    >
                      <div className="flex items-center mb-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-3" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suppliers */}
          {state.results.suppliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 text-green-500 mr-2" />
                  ผู้จำหน่าย ({state.results.suppliers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.results.suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleResultClick('supplier', supplier.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 hover:border-green-300"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{supplier.name}</h3>
                      <div className="space-y-1 text-sm text-gray-500">
                        {supplier.contact && <p>ติดต่อ: {supplier.contact}</p>}
                        {supplier.email && <p>อีเมล: {supplier.email}</p>}
                        {supplier.phone && <p>โทร: {supplier.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Movements */}
          {state.results.movements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RotateCcw className="h-5 w-5 text-orange-500 mr-2" />
                  การเคลื่อนไหว ({state.results.movements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.results.movements.map((movement) => (
                    <div
                      key={movement.id}
                      onClick={() => handleResultClick('movement', movement.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 hover:border-orange-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{movement.reason}</h3>
                        <Badge className={getMovementTypeColor(movement.type)}>
                          {getMovementTypeText(movement.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>จำนวน: {movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)}</span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(movement.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      {movement.reference && (
                        <p className="text-xs text-gray-400 mt-1">อ้างอิง: {movement.reference}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {state.totalResults === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่พบผลการค้นหา</h3>
                <p className="text-gray-500 mb-4">ลองใช้คำค้นหาอื่นหรือปรับตัวกรอง</p>
                <Button onClick={clearSearch}>
                  ล้างการค้นหา
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
