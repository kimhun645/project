import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Camera, Package, Search, AlertCircle, CheckCircle, XCircle, RefreshCw, Eye, BarChart3, TrendingUp, Activity, Clock, ArrowLeft, Scan } from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { useToast } from '@/hooks/use-toast';
import { type Product } from '@/lib/firestoreService';
import { safeFilter, safeLength, safeUnique } from '@/utils/arraySafety';
import { ProductsStylePageLayout, ProductsStylePageHeader, ProductsStyleStatsCards } from '@/components/ui/products-style-components';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

interface ProductWithCategory extends Product {
  categories?: { name: string };
  suppliers?: { name: string };
}

export default function Scanner() {
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<ProductWithCategory | null>(null);
  const [recentScans, setRecentScans] = useState<ProductWithCategory[]>([]);
  const [lastScanAt, setLastScanAt] = useState<string>('');
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
      const { FirestoreService } = await import('@/lib/firestoreService');
      const products = await FirestoreService.getProducts();
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
      setLastScanAt(new Date().toLocaleString('th-TH'));
      
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
  const uniqueProducts = safeLength(safeUnique(recentScans));

  const statsCards = [
    {
      title: 'การสแกนล่าสุด',
      value: totalScans,
      icon: <Activity className="h-5 w-5" />,
      color: 'blue' as const,
      trend: 'up' as const
    },
    {
      title: 'สถานะเครื่องสแกน',
      value: scannerDetected ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน',
      icon: <Camera className="h-5 w-5" />,
      color: scannerDetected ? 'green' as const : 'red' as const,
      trend: 'neutral' as const
    },
    {
      title: 'เวลาสแกนล่าสุด',
      value: lastScanAt || 'ยังไม่มีการสแกน',
      icon: <Clock className="h-5 w-5" />,
      color: 'purple' as const,
      trend: 'neutral' as const
    },
    {
      title: 'สินค้าพบ',
      value: uniqueProducts,
      icon: <Package className="h-5 w-5" />,
      color: 'orange' as const,
      trend: 'neutral' as const
    }
  ];

  return (
    <ProductsStylePageLayout>
      <ProductsStylePageHeader
        title="สแกนบาร์โค้ด"
        description="ระบบบริหารพัสดุ | อัปเดต: 16:16:58"
        icon={Camera}
        searchPlaceholder="ป้อน SKU สินค้า..."
        searchValue={barcode}
        onSearchChange={setBarcode}
        onRefresh={() => {
          setBarcode('');
          setScannedProduct(null);
          setRecentScans([]);
          setLastScanAt('');
          toast({ title: "รีเซ็ตการสแกน", description: "ล้างข้อมูลการสแกนทั้งหมดแล้ว" });
        }}
        scannerDetected={scannerDetected}
        primaryAction={
          <Button onClick={() => handleScan()} disabled={!barcode.trim()} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300">
            <Search className="h-4 w-4 mr-2" /> ค้นหา
          </Button>
        }
        secondaryActions={[
          <Button key="back-to-products" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
            <ArrowLeft className="h-4 w-4 mr-2" /> กลับไปหน้าสินค้า
          </Button>
        ]}
      />

      <div className="space-y-6 mt-6">
        {/* Stats Cards */}
        <ProductsStyleStatsCards cards={statsCards} />

        {/* Main Scanner Area */}
        <Card className="relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-2 transform">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-6 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <Camera className="h-7 w-7" />
              ป้อน SKU สินค้า
            </CardTitle>
            <p className="text-blue-100 text-sm">รองรับเครื่องอ่านบาร์โค้ด หรือพิมพ์ SKU ด้วยตนเอง</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-2 w-2 rounded-full ${scannerDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-blue-100">
                {scannerDetected ? 'เครื่องสแกนเชื่อมต่อ' : 'รอการเชื่อมต่อเครื่องสแกน'}
              </span>
              {scannerDetected && (
                <span className="text-xs text-green-200 bg-green-800/30 px-2 py-1 rounded-full">
                  พร้อมใช้งาน
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Scanner status */}
            <div className={`w-full text-sm border rounded-md px-4 py-3 flex items-center gap-3 transition-all duration-300 ${
              scannerDetected 
                ? 'text-green-800 bg-green-50 border-green-200' 
                : 'text-red-800 bg-red-50 border-red-200'
            }`}>
              <div className={`h-3 w-3 rounded-full ${scannerDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="font-medium">สถานะเครื่องสแกน:</span>
              {scannerDetected ? (
                <span className="inline-flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle className="h-4 w-4" /> เชื่อมต่อแล้ว - พร้อมใช้งาน
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-red-700 font-semibold">
                  <XCircle className="h-4 w-4" /> ยังไม่ได้เชื่อมต่อ - รอการเชื่อมต่อ
                </span>
              )}
              {scannerDetected && (
                <div className="ml-auto">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    พร้อมสแกน
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Input
                type="text"
                placeholder="ป้อน SKU สินค้า..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScan();
                  }
                }}
                className="flex-1 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
              />
              <Button 
                onClick={() => handleScan()} 
                disabled={!barcode.trim()}
                className="h-12 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
              >
                <Search className="h-5 w-5 mr-2" /> ค้นหา
              </Button>
            </div>

            {scannedProduct ? (
              <Card className="border-blue-200 bg-blue-50 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-blue-700">
                    <Package className="h-5 w-5 inline-block mr-2" /> สินค้าที่พบ
                  </CardTitle>
                  <Badge variant="default" className="bg-green-500 text-white">
                    <CheckCircle className="h-4 w-4 mr-1" /> พบแล้ว
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-2xl font-bold text-blue-800">{scannedProduct.name}</p>
                  <p className="text-sm text-gray-600">SKU: {scannedProduct.sku} | Barcode: {scannedProduct.barcode}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      คงเหลือ: {scannedProduct.current_stock || 0} ชิ้น
                    </Badge>
                    {scannedProduct.categories?.name && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        หมวดหมู่: {scannedProduct.categories.name}
                      </Badge>
                    )}
                    {scannedProduct.suppliers?.name && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        ผู้จัดจำหน่าย: {scannedProduct.suppliers.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Scan className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">ยังไม่มีการสแกนสินค้า</p>
                <p className="text-sm">เริ่มต้นสแกนสินค้าเพื่อดูประวัติการสแกน</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans - Moved to bottom */}
        <Card className="relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 transform">
          <CardHeader className="bg-gradient-to-br from-purple-600 to-indigo-500 text-white p-6 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <Clock className="h-5 w-5" />
              การสแกนล่าสุด
            </CardTitle>
            <p className="text-purple-100 text-sm">ประวัติการสแกนสินค้า 5 รายการล่าสุด</p>
          </CardHeader>
          <CardContent className="p-6">
            {safeLength(recentScans) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentScans.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.current_stock || 0} ชิ้น
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Scan className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">ยังไม่มีการสแกนสินค้า</p>
                <p className="text-sm text-gray-400">เริ่มต้นสแกนสินค้าเพื่อดูประวัติการสแกน</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProductsStylePageLayout>
  );
}
