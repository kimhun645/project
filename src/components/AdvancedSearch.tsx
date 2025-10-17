import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Save, History, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchService, SearchQuery, SearchFilter } from '@/lib/searchService';
import { useNotifications } from '@/hooks/useNotifications';

interface AdvancedSearchProps {
  onSearch: (query: SearchQuery) => void;
  onClear: () => void;
  searchFields: string[];
  placeholder?: string;
  className?: string;
}

export function AdvancedSearch({ 
  onSearch, 
  onClear, 
  searchFields, 
  placeholder = "ค้นหาข้อมูล...",
  className = ""
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedQueries, setSavedQueries] = useState<Record<string, SearchQuery & { savedAt: string }>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { showNotification } = useNotifications();

  // Load saved queries and history
  useEffect(() => {
    setSavedQueries(SearchService.getSavedQueries());
    setSearchHistory(SearchService.getSearchHistory());
  }, []);

  // Get suggestions
  useEffect(() => {
    if (searchTerm.length > 2) {
      // This would typically fetch from your data source
      const mockSuggestions = [
        'สินค้า A', 'สินค้า B', 'หมวดหมู่ 1', 'หมวดหมู่ 2',
        'ผู้จำหน่าย X', 'ผู้จำหน่าย Y', 'การเคลื่อนไหว'
      ].filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Add filter
  const addFilter = () => {
    const newFilter: SearchFilter = {
      field: '',
      operator: 'contains',
      value: '',
      caseSensitive: false
    };
    setFilters([...filters, newFilter]);
  };

  // Remove filter
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Update filter
  const updateFilter = (index: number, field: keyof SearchFilter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
  };

  // Execute search
  const executeSearch = () => {
    const query: SearchQuery = {
      term: searchTerm,
      filters,
      sortBy: sortBy || undefined,
      sortDirection,
      limit: 50,
      offset: 0
    };

    // Add to search history
    if (searchTerm) {
      SearchService.addToSearchHistory(searchTerm);
      setSearchHistory(SearchService.getSearchHistory());
    }

    onSearch(query);
    setShowSuggestions(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setFilters([]);
    setSortBy('');
    setSortDirection('asc');
    onClear();
  };

  // Save query
  const saveQuery = () => {
    const queryName = prompt('กรุณาใส่ชื่อการค้นหา:');
    if (queryName) {
      const query: SearchQuery = {
        term: searchTerm,
        filters,
        sortBy: sortBy || undefined,
        sortDirection
      };
      
      SearchService.saveSearchQuery(queryName, query);
      setSavedQueries(SearchService.getSavedQueries());
      showNotification({
        title: 'บันทึกการค้นหา',
        message: `บันทึกการค้นหา "${queryName}" เรียบร้อยแล้ว`,
        type: 'success'
      });
    }
  };

  // Load saved query
  const loadSavedQuery = (queryName: string) => {
    const query = savedQueries[queryName];
    if (query) {
      setSearchTerm(query.term);
      setFilters(query.filters || []);
      setSortBy(query.sortBy || '');
      setSortDirection(query.sortDirection || 'asc');
    }
  };

  // Delete saved query
  const deleteSavedQuery = (queryName: string) => {
    SearchService.deleteSavedQuery(queryName);
    setSavedQueries(SearchService.getSavedQueries());
    showNotification({
      title: 'ลบการค้นหา',
      message: `ลบการค้นหา "${queryName}" เรียบร้อยแล้ว`,
      type: 'info'
    });
  };

  // Export search results
  const exportResults = () => {
    const query: SearchQuery = {
      term: searchTerm,
      filters,
      sortBy: sortBy || undefined,
      sortDirection
    };
    
    const exportData = {
      query,
      timestamp: new Date().toISOString(),
      searchFields
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_query_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import search query
  const importQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.query) {
            setSearchTerm(data.query.term || '');
            setFilters(data.query.filters || []);
            setSortBy(data.query.sortBy || '');
            setSortDirection(data.query.sortDirection || 'asc');
            showNotification({
              title: 'นำเข้าข้อมูล',
              message: 'นำเข้าข้อมูลการค้นหาเรียบร้อยแล้ว',
              type: 'success'
            });
          }
        } catch (error) {
          showNotification({
            title: 'ข้อผิดพลาด',
            message: 'ไม่สามารถนำเข้าข้อมูลได้',
            type: 'error'
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4"
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSearchTerm(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={executeSearch} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          ค้นหา
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showAdvanced ? 'ซ่อนตัวกรอง' : 'ตัวกรองขั้นสูง'}
        </Button>
        
        <Button variant="outline" onClick={clearSearch} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          ล้าง
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ตัวกรองขั้นสูง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(index, 'field', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="ฟิลด์" />
                    </SelectTrigger>
                    <SelectContent>
                      {searchFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(index, 'operator', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">เท่ากับ</SelectItem>
                      <SelectItem value="contains">ประกอบด้วย</SelectItem>
                      <SelectItem value="startsWith">ขึ้นต้นด้วย</SelectItem>
                      <SelectItem value="endsWith">ลงท้ายด้วย</SelectItem>
                      <SelectItem value="greaterThan">มากกว่า</SelectItem>
                      <SelectItem value="lessThan">น้อยกว่า</SelectItem>
                      <SelectItem value="between">ระหว่าง</SelectItem>
                      <SelectItem value="in">อยู่ใน</SelectItem>
                      <SelectItem value="notIn">ไม่อยู่ใน</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    placeholder="ค่า"
                    className="flex-1"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFilter(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" onClick={addFilter} className="w-full">
                + เพิ่มตัวกรอง
              </Button>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sortBy">เรียงตาม</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกฟิลด์" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchFields.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sortDirection">ทิศทาง</Label>
                <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">น้อยไปมาก</SelectItem>
                    <SelectItem value="desc">มากไปน้อย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Queries and History */}
      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="saved">การค้นหาที่บันทึก</TabsTrigger>
          <TabsTrigger value="history">ประวัติการค้นหา</TabsTrigger>
        </TabsList>
        
        <TabsContent value="saved" className="space-y-2">
          {Object.keys(savedQueries).length > 0 ? (
            Object.entries(savedQueries).map(([name, query]) => (
              <div key={name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-500">
                    {query.term} • {query.filters?.length || 0} ตัวกรอง
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSavedQuery(name)}
                  >
                    โหลด
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSavedQuery(name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ลบ
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">ยังไม่มีการค้นหาที่บันทึก</p>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-2">
          {searchHistory.length > 0 ? (
            searchHistory.map((term, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-400" />
                  <span>{term}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm(term)}
                >
                  ใช้
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">ยังไม่มีประวัติการค้นหา</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Export/Import Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={saveQuery} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          บันทึกการค้นหา
        </Button>
        
        <Button variant="outline" onClick={exportResults} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          ส่งออก
        </Button>
        
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={importQuery}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            นำเข้า
          </Button>
        </div>
      </div>
    </div>
  );
}
