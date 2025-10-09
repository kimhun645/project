
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Search, Package, AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { type Product } from '@/lib/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';
import { ensureArray, safeMap, safeLength, safeFilter } from '@/utils/arraySafety';
import {
  ProductsStylePageLayout,
  ProductsStylePageHeader,
  ProductsStyleStatsCards,
  type StatCard
} from '@/components/ui/shared-components';

interface ProductWithCategory extends Product {
  categories?: { name: string };
  suppliers?: { name: string };
}

export default function Scanner() {
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<ProductWithCategory | null>(null);
  const [recentScans, setRecentScans] = useState<ProductWithCategory[]>([]);
  const { toast } = useToast();

  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      setBarcode(scannedCode);
      handleScan(scannedCode);
    },
    minLength: 3,
    timeout: 100
  });

  const searchProductByBarcode = async (barcodeValue: string) => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const products = await firestoreService.getProducts();
      return products.find(p => p.barcode === barcodeValue || p.sku === barcodeValue) || null;
    } catch (error) {
      console.error('Error searching product:', error);
      return null;
    }
  };

  const handleScan = async (barcodeValue?: string) => {
    const codeToScan = barcodeValue || barcode.trim();
    if (!codeToScan) return;
    
    const product = await searchProductByBarcode(codeToScan);
    setScannedProduct(product);
    
    if (product) {
      // Add to recent scans
      setRecentScans(prev => {
        const filtered = safeFilter(prev, p => p.id !== product.id);
        return [product, ...filtered].slice(0, 5);
      });
      
      toast({
        title: "สินค้าพบแล้ว",
        description: `${product.name} - คงเหลือ ${product.current_stock || 0} ชิ้น`,
      });
    } else {
      toast({
        title: "ไม่พบสินค้า",
        description: `ไม่พบสินค้าที่มี SKU: ${codeToScan}`,
        variant: "destructive",
      });
      
      setTimeout(() => setScannedProduct(null), 3000);
    }
  };

  // Auto-scan when barcode changes from scanner
  useEffect(() => {
    if (lastScannedCode && lastScannedCode !== barcode) {
      setBarcode(lastScannedCode);
    }
  }, [lastScannedCode, barcode]);

  // Calculate stats
  const totalScans = safeLength(recentScans);
  const scannerStatus = scannerDetected ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน";
  const lastScanTime = recentScans.length > 0 ? "เมื่อสักครู่" : "ยังไม่มีการสแกน";

  // Define stats cards
  const statsCards: StatCard[] = [
    {
      title: "การสแกนล่าสุด",
      value: totalScans.toString(),
      icon: <ScanLine className="h-6 w-6" />,
      color: "teal"
    },
    {
      title: "สถานะเครื่องสแกน",
      value: scannerStatus,
      icon: <CheckCircle className="h-6 w-6" />,
      color: scannerDetected ? "green" : "red"
    },
    {
      title: "เวลาสแกนล่าสุด",
      value: lastScanTime,
      icon: <Clock className="h-6 w-6" />,
      color: "purple"
    },
    {
      title: "สินค้าพบ",
      value: scannedProduct ? "1" : "0",
      icon: <Package className="h-6 w-6" />,
      color: scannedProduct ? "green" : "orange"
    }
  ];

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="สแกนบาร์โค้ด"
        searchPlaceholder="ป้อน SKU สินค้า..."
        searchValue={barcode}
        onSearchChange={setBarcode}
        onRefresh={() => {
          setBarcode('');
          setScannedProduct(null);
          setRecentScans([]);
        }}
        scannerDetected={scannerDetected}
        actionButtons={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setBarcode('');
                setScannedProduct(null);
                setRecentScans([]);
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              รีเซ็ต
            </Button>
            <Button 
              onClick={() => handleScan()}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Search className="h-4 w-4" />
              ค้นหา
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      <div className="w-full space-y-6 pb-8">

        {/* Manual Input */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
          <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
            </div>
            
            <CardHeader className="pb-4 relative z-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
                  <ScanLine className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">ป้อน SKU สินค้า</CardTitle>
                <p className="text-sm text-gray-600">
                  รองรับเครื่องอ่านบาร์โค้ด หรือพิมพ์ SKU ด้วยตนเอง
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* Scanner Status */}
              <div className="flex items-center justify-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                <span className="text-sm font-medium text-gray-700">สถานะเครื่องสแกน:</span>
                <BarcodeScannerIndicator isDetected={scannerDetected} />
                {scannerDetected && (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">พร้อมใช้งาน</span>
                  </div>
                )}
              </div>
              
              {scannerDetected && (
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-medium">
                    ✨ พร้อมใช้งาน - สแกนบาร์โค้ดได้เลย
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Input
                  placeholder="ป้อน SKU สินค้า..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  className="flex-1 text-base h-12 border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 bg-white/90 backdrop-blur-sm font-medium placeholder:text-gray-500"
                />
                <Button 
                  onClick={() => handleScan()} 
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-5 w-5 mr-2" />
                  ค้นหา
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Result */}
        {scannedProduct && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
            <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-50 via-white to-emerald-50">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-200 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
              </div>
              
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">พบสินค้าแล้ว</CardTitle>
                    <p className="text-sm text-gray-600">ข้อมูลสินค้าที่สแกนพบ</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">ชื่อสินค้า</label>
                      <p className="text-lg font-bold text-gray-900 break-words">{scannedProduct.name}</p>
                    </div>
                    
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">SKU</label>
                      <p className="text-base font-semibold text-gray-800 break-all">{scannedProduct.sku}</p>
                    </div>
                    
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">หมวดหมู่</label>
                      <p className="text-base font-semibold text-gray-800">{scannedProduct.categories?.name || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">สต็อกปัจจุบัน</label>
                      <p className="text-3xl font-bold text-gray-900">{(scannedProduct.current_stock || 0).toLocaleString()}</p>
                    </div>
                    
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">ราคาต่อหน่วย</label>
                      <p className="text-xl font-bold text-gray-900">฿{(scannedProduct.unit_price || 0).toLocaleString()}</p>
                    </div>
                    
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">สถานะสต็อก</label>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={scannedProduct.current_stock > scannedProduct.min_stock ? 'default' : scannedProduct.current_stock > 0 ? 'secondary' : 'destructive'}
                          className={`text-sm font-medium px-3 py-1 ${
                            scannedProduct.current_stock > scannedProduct.min_stock
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : scannedProduct.current_stock > 0
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                          }`}
                        >
                          {scannedProduct.current_stock > scannedProduct.min_stock 
                            ? 'สต็อกเพียงพอ' 
                            : scannedProduct.current_stock > 0 
                              ? 'สต็อกต่ำ' 
                              : 'หมดสต็อก'
                          }
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${
                          scannedProduct.current_stock > scannedProduct.min_stock ? 'bg-green-500' : 
                          scannedProduct.current_stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="outline" className="flex-1 h-12 text-base border-2 border-green-200 hover:bg-green-50 hover:border-green-300">
                    อัพเดทสต็อก
                  </Button>
                  <Button variant="outline" className="flex-1 h-12 text-base border-2 border-green-200 hover:bg-green-50 hover:border-green-300">
                    รายละเอียดเพิ่มเติม
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Not Found */}
        {barcode && scannedProduct === null && barcode.trim() !== '' && (
          <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
            <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-orange-50 via-white to-red-50">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-200 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
              </div>
              
              <CardContent className="p-8 text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-6 shadow-lg">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่พบสินค้า</h3>
                <p className="text-sm text-gray-600 mb-4">
                  ไม่พบสินค้าที่มี SKU: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-orange-600">{barcode}</span>
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">ลองตรวจสอบ:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• SKU ที่ป้อนถูกต้องหรือไม่</li>
                    <li>• สินค้าถูกเพิ่มในระบบแล้วหรือไม่</li>
                    <li>• ลองสแกนบาร์โค้ดใหม่</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-6 h-12 px-6 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => {
                    setBarcode('');
                    setScannedProduct(null);
                  }}
                >
                  ลองใหม่
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Scans */}
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
          <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 via-white to-pink-50">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-200 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
            </div>
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">การสแกนล่าสุด</CardTitle>
                  <p className="text-sm text-gray-600">ประวัติการสแกนสินค้า 5 รายการล่าสุด</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {safeLength(recentScans) > 0 ? (
                <div className="space-y-4">
                  {safeMap(recentScans, (product, index) => (
                    <div key={product.id} className="group/item flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 hover:bg-white hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover/item:text-purple-700 transition-colors">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                              {product.sku}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              สต็อก: {(product.current_stock || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500 font-medium">
                          {index === 0 ? 'เมื่อสักครู่' : `${index} นาทีที่แล้ว`}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            product.current_stock > product.min_stock ? 'bg-green-500' : 
                            product.current_stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs text-gray-500">
                            {product.current_stock > product.min_stock ? 'ปกติ' : 
                             product.current_stock > 0 ? 'ต่ำ' : 'หมด'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <ScanLine className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-base mb-2">ยังไม่มีการสแกนสินค้า</p>
                  <p className="text-sm text-gray-400">เริ่มต้นสแกนสินค้าเพื่อดูประวัติการสแกน</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProductsStylePageLayout>
  );
}
