import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Download, 
  Upload, 
  RotateCcw,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { themeManager, ThemeSettings, ColorPalette } from '@/lib/themeManager';

export function ThemeSettings() {
  const [settings, setSettings] = useState<ThemeSettings>(themeManager.getSettings());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load initial settings
    setSettings(themeManager.getSettings());

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  const handleSettingChange = (key: keyof ThemeSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    themeManager.updateSettings({ [key]: value });
  };

  const handleReset = () => {
    themeManager.resetToDefault();
  };

  const handleExport = () => {
    const themeJson = themeManager.exportTheme();
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'theme-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (themeManager.importTheme(content)) {
          console.log('Theme imported successfully');
        } else {
          alert('ไม่สามารถนำเข้าธีมได้');
        }
      };
      reader.readAsText(file);
    }
  };

  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'auto':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeName = (mode: string) => {
    switch (mode) {
      case 'light':
        return 'โหมดสว่าง';
      case 'dark':
        return 'โหมดมืด';
      case 'auto':
        return 'อัตโนมัติ';
      default:
        return 'โหมดสว่าง';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">การตั้งค่าธีม</h2>
          <p className="text-gray-600">ปรับแต่งรูปลักษณ์และความรู้สึกของแอปพลิเคชัน</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            รีเซ็ต
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                นำเข้า
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Theme Settings Tabs */}
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">
            <Eye className="h-4 w-4 mr-2" />
            รูปลักษณ์
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            สี
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            ตัวอักษร
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            เลย์เอาต์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>โหมดธีม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themeManager.getAvailableThemes().map((theme) => (
                  <div
                    key={theme.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      settings.mode === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSettingChange('mode', theme.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {getThemeIcon(theme.id)}
                      <div>
                        <h3 className="font-medium">{theme.name}</h3>
                        <p className="text-sm text-gray-500">{theme.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">แอนิเมชัน</h4>
                    <p className="text-sm text-gray-500">แสดงแอนิเมชันและเอฟเฟกต์</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animations}
                    onChange={(e) => handleSettingChange('animations', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">ลดการเคลื่อนไหว</h4>
                    <p className="text-sm text-gray-500">ลดแอนิเมชันสำหรับผู้ที่ไวต่อการเคลื่อนไหว</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>สีหลัก</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'น้ำเงิน', value: '#3b82f6' },
                  { name: 'เขียว', value: '#10b981' },
                  { name: 'ม่วง', value: '#8b5cf6' },
                  { name: 'แดง', value: '#ef4444' },
                  { name: 'ส้ม', value: '#f59e0b' },
                  { name: 'ชมพู', value: '#ec4899' },
                  { name: 'เทา', value: '#6b7280' },
                  { name: 'เขียวเข้ม', value: '#059669' }
                ].map((color) => (
                  <div
                    key={color.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      settings.primaryColor === color.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSettingChange('primaryColor', color.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color.value }}
                      ></div>
                      <span className="text-sm font-medium">{color.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>สีรอง</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'เทา', value: '#64748b' },
                  { name: 'น้ำเงินเข้ม', value: '#1e40af' },
                  { name: 'เขียวเข้ม', value: '#059669' },
                  { name: 'ม่วงเข้ม', value: '#7c3aed' }
                ].map((color) => (
                  <div
                    key={color.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      settings.secondaryColor === color.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSettingChange('secondaryColor', color.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color.value }}
                      ></div>
                      <span className="text-sm font-medium">{color.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ฟอนต์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">ครอบครัวฟอนต์</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    {themeManager.getAvailableFontFamilies().map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name} - {font.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">ขนาดฟอนต์</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {themeManager.getAvailableFontSizes().map((size) => (
                      <button
                        key={size.id}
                        className={`p-3 border rounded-lg text-center transition-all duration-200 ${
                          settings.fontSize === size.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSettingChange('fontSize', size.id)}
                      >
                        <div className="font-medium">{size.name}</div>
                        <div className="text-xs text-gray-500">{size.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>การจัดวาง</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">มุมโค้งมน</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {themeManager.getAvailableBorderRadius().map((radius) => (
                      <button
                        key={radius.id}
                        className={`p-3 border rounded-lg text-center transition-all duration-200 ${
                          settings.borderRadius === radius.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSettingChange('borderRadius', radius.id)}
                      >
                        <div className="font-medium">{radius.name}</div>
                        <div className="text-xs text-gray-500">{radius.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">ระยะห่าง</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {themeManager.getAvailableSpacing().map((spacing) => (
                      <button
                        key={spacing.id}
                        className={`p-3 border rounded-lg text-center transition-all duration-200 ${
                          settings.spacing === spacing.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSettingChange('spacing', spacing.id)}
                      >
                        <div className="font-medium">{spacing.name}</div>
                        <div className="text-xs text-gray-500">{spacing.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวอย่าง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-white">
              <h3 className="text-lg font-semibold mb-2">ตัวอย่างการ์ด</h3>
              <p className="text-gray-600 mb-4">นี่คือตัวอย่างการ์ดที่แสดงการตั้งค่าธีมปัจจุบัน</p>
              <div className="flex space-x-2">
                <Button size="sm">ปุ่มหลัก</Button>
                <Button variant="outline" size="sm">ปุ่มรอง</Button>
                <Badge>ป้ายกำกับ</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
