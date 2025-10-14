/**
 * Helper function to safely display values and prevent React Error #31
 * @param value - The value to display
 * @returns A safe string representation of the value
 */
export function display(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    // For objects, try to extract meaningful information
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    // For objects with common properties, show the most relevant one
    if ('name' in value && typeof value.name === 'string') {
      return value.name;
    }
    if ('title' in value && typeof value.title === 'string') {
      return value.title;
    }
    if ('id' in value && typeof value.id === 'string') {
      return value.id;
    }
    // Fallback to JSON string for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      return JSON.stringify(value);
    }
    return '[Object]';
  }
  return String(value);
}

/**
 * Format date safely
 * @param dateValue - Date string or Date object
 * @returns Formatted date string or fallback
 */
export function formatDateSafe(dateValue: unknown): string {
  if (!dateValue) return '-';
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateValue === 'string') {
      // Handle ISO string or other string formats
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      // Handle Firestore Timestamp
      date = (dateValue as any).toDate();
    } else {
      console.warn('Unsupported date type:', typeof dateValue, dateValue);
      return '-';
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateValue, 'parsed as:', date);
      return '-';
    }
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.warn('Date formatting error:', error, 'Value:', dateValue);
    return '-';
  }
}

/**
 * Format number safely
 * @param numValue - Number or string
 * @returns Formatted number string or fallback
 */
export function formatNumberSafe(numValue: unknown): string {
  if (numValue == null) return '0';
  
  const num = Number(numValue);
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('th-TH');
}
