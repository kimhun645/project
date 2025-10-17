export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  caseSensitive?: boolean;
}

export interface SearchQuery {
  term: string;
  filters: SearchFilter[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  searchTime: number;
}

export class SearchService {
  // Advanced search operators
  static search<T>(
    data: T[],
    query: SearchQuery,
    searchFields: string[] = []
  ): SearchResult<T> {
    const startTime = Date.now();
    let results = [...data];

    // Text search
    if (query.term && searchFields.length > 0) {
      results = results.filter(item => {
        return searchFields.some(field => {
          const value = this.getNestedValue(item, field);
          if (value === null || value === undefined) return false;
          
          const searchTerm = query.caseSensitive ? query.term : query.term.toLowerCase();
          const itemValue = query.caseSensitive ? String(value) : String(value).toLowerCase();
          
          return itemValue.includes(searchTerm);
        });
      });
    }

    // Apply filters
    if (query.filters && query.filters.length > 0) {
      results = results.filter(item => {
        return query.filters.every(filter => {
          const value = this.getNestedValue(item, filter.field);
          return this.applyFilter(value, filter);
        });
      });
    }

    // Apply sorting
    if (query.sortBy) {
      results.sort((a, b) => {
        const aValue = this.getNestedValue(a, query.sortBy!);
        const bValue = this.getNestedValue(b, query.sortBy!);
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return query.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || total;
    const paginatedResults = results.slice(offset, offset + limit);

    const searchTime = Date.now() - startTime;

    return {
      data: paginatedResults,
      total,
      hasMore: offset + limit < total,
      searchTime
    };
  }

  // Get nested value from object
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Apply filter to value
  private static applyFilter(value: any, filter: SearchFilter): boolean {
    if (value === null || value === undefined) return false;

    const filterValue = filter.value;
    const itemValue = filter.caseSensitive ? String(value) : String(value).toLowerCase();
    const searchValue = filter.caseSensitive ? String(filterValue) : String(filterValue).toLowerCase();

    switch (filter.operator) {
      case 'equals':
        return itemValue === searchValue;
      case 'contains':
        return itemValue.includes(searchValue);
      case 'startsWith':
        return itemValue.startsWith(searchValue);
      case 'endsWith':
        return itemValue.endsWith(searchValue);
      case 'greaterThan':
        return Number(value) > Number(filterValue);
      case 'lessThan':
        return Number(value) < Number(filterValue);
      case 'between':
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          return Number(value) >= Number(filterValue[0]) && Number(value) <= Number(filterValue[1]);
        }
        return false;
      case 'in':
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }
        return false;
      case 'notIn':
        if (Array.isArray(filterValue)) {
          return !filterValue.includes(value);
        }
        return true;
      default:
        return false;
    }
  }

  // Build search query from form data
  static buildSearchQuery(formData: any, searchFields: string[] = []): SearchQuery {
    const query: SearchQuery = {
      term: formData.searchTerm || '',
      filters: [],
      sortBy: formData.sortBy,
      sortDirection: formData.sortDirection || 'asc',
      limit: formData.limit || 50,
      offset: formData.offset || 0
    };

    // Add filters based on form data
    if (formData.category && formData.category !== 'all') {
      query.filters.push({
        field: 'category',
        operator: 'equals',
        value: formData.category
      });
    }

    if (formData.supplier && formData.supplier !== 'all') {
      query.filters.push({
        field: 'supplier',
        operator: 'equals',
        value: formData.supplier
      });
    }

    if (formData.status && formData.status !== 'all') {
      query.filters.push({
        field: 'status',
        operator: 'equals',
        value: formData.status
      });
    }

    if (formData.priceRange) {
      const [min, max] = formData.priceRange;
      if (min !== undefined && max !== undefined) {
        query.filters.push({
          field: 'price',
          operator: 'between',
          value: [min, max]
        });
      }
    }

    if (formData.stockRange) {
      const [min, max] = formData.stockRange;
      if (min !== undefined && max !== undefined) {
        query.filters.push({
          field: 'stock',
          operator: 'between',
          value: [min, max]
        });
      }
    }

    if (formData.dateRange) {
      const [startDate, endDate] = formData.dateRange;
      if (startDate && endDate) {
        query.filters.push({
          field: 'createdAt',
          operator: 'between',
          value: [startDate, endDate]
        });
      }
    }

    if (formData.tags && formData.tags.length > 0) {
      query.filters.push({
        field: 'tags',
        operator: 'in',
        value: formData.tags
      });
    }

    return query;
  }

  // Get search suggestions
  static getSearchSuggestions<T>(
    data: T[],
    field: string,
    term: string,
    limit: number = 10
  ): string[] {
    const suggestions = new Set<string>();
    
    data.forEach(item => {
      const value = this.getNestedValue(item, field);
      if (value && String(value).toLowerCase().includes(term.toLowerCase())) {
        suggestions.add(String(value));
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Save search query
  static saveSearchQuery(name: string, query: SearchQuery): void {
    const savedQueries = this.getSavedQueries();
    savedQueries[name] = {
      ...query,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('savedSearchQueries', JSON.stringify(savedQueries));
  }

  // Get saved search queries
  static getSavedQueries(): Record<string, SearchQuery & { savedAt: string }> {
    const saved = localStorage.getItem('savedSearchQueries');
    return saved ? JSON.parse(saved) : {};
  }

  // Delete saved search query
  static deleteSavedQuery(name: string): void {
    const savedQueries = this.getSavedQueries();
    delete savedQueries[name];
    localStorage.setItem('savedSearchQueries', JSON.stringify(savedQueries));
  }

  // Get search history
  static getSearchHistory(): string[] {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  }

  // Add to search history
  static addToSearchHistory(term: string): void {
    const history = this.getSearchHistory();
    const filteredHistory = history.filter(item => item !== term);
    const newHistory = [term, ...filteredHistory].slice(0, 20); // Keep last 20 searches
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }

  // Clear search history
  static clearSearchHistory(): void {
    localStorage.removeItem('searchHistory');
  }
}
