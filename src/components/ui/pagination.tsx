import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  className = ''
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left: Display Information */}
        <div className="text-gray-600 text-sm font-medium">
          แสดง {startItem} - {endItem} จาก {totalItems} รายการ
        </div>

        {/* Center: Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-10 w-10 rounded-xl border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Button>

          {/* Current Page Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 rounded-xl bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700 hover:border-purple-700 shadow-md"
          >
            {currentPage}
          </Button>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-10 w-10 rounded-xl border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Right: Items Per Page Selector */}
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm font-medium">แสดง:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20 h-10 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/50 bg-white font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-purple-200 rounded-xl">
              {itemsPerPageOptions.map((option) => (
                <SelectItem
                  key={option}
                  value={option.toString()}
                  className="text-center font-medium"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}