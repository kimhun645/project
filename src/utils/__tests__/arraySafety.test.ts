// Array Safety Utilities Tests
import { 
  ensureArray, 
  safeMap, 
  safeFilter, 
  safeLength, 
  safeIsEmpty, 
  safeGet, 
  safeFind, 
  safeReduce, 
  safeSort, 
  safeSlice, 
  safeConcat, 
  safeIncludes, 
  safeUnique, 
  safeGroupBy, 
  safeEvery, 
  safeSome 
} from '../arraySafety';

describe('Array Safety Utilities', () => {
  describe('ensureArray', () => {
    it('should return array as is', () => {
      const arr = [1, 2, 3];
      expect(ensureArray(arr)).toEqual([1, 2, 3]);
    });

    it('should return empty array for undefined', () => {
      expect(ensureArray(undefined)).toEqual([]);
    });

    it('should return empty array for null', () => {
      expect(ensureArray(null)).toEqual([]);
    });

    it('should wrap single value in array', () => {
      expect(ensureArray(42)).toEqual([42]);
    });

    it('should handle empty array', () => {
      expect(ensureArray([])).toEqual([]);
    });
  });

  describe('safeMap', () => {
    it('should map over array', () => {
      const arr = [1, 2, 3];
      const result = safeMap(arr, x => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should return empty array for undefined', () => {
      const result = safeMap(undefined, x => x * 2);
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = safeMap(null, x => x * 2);
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = safeMap([], x => x * 2);
      expect(result).toEqual([]);
    });
  });

  describe('safeFilter', () => {
    it('should filter array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = safeFilter(arr, x => x % 2 === 0);
      expect(result).toEqual([2, 4]);
    });

    it('should return empty array for undefined', () => {
      const result = safeFilter(undefined, x => x % 2 === 0);
      expect(result).toEqual([]);
    });
  });

  describe('safeLength', () => {
    it('should return array length', () => {
      expect(safeLength([1, 2, 3])).toBe(3);
    });

    it('should return 0 for undefined', () => {
      expect(safeLength(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(safeLength(null)).toBe(0);
    });
  });

  describe('safeIsEmpty', () => {
    it('should return true for empty array', () => {
      expect(safeIsEmpty([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(safeIsEmpty([1, 2, 3])).toBe(false);
    });

    it('should return true for undefined', () => {
      expect(safeIsEmpty(undefined)).toBe(true);
    });
  });

  describe('safeGet', () => {
    it('should get item by index', () => {
      const arr = [1, 2, 3];
      expect(safeGet(arr, 1)).toBe(2);
    });

    it('should return undefined for out of bounds', () => {
      const arr = [1, 2, 3];
      expect(safeGet(arr, 5)).toBeUndefined();
    });

    it('should return undefined for undefined array', () => {
      expect(safeGet(undefined, 0)).toBeUndefined();
    });
  });

  describe('safeFind', () => {
    it('should find item', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = safeFind(arr, x => x > 3);
      expect(result).toBe(4);
    });

    it('should return undefined if not found', () => {
      const arr = [1, 2, 3];
      const result = safeFind(arr, x => x > 5);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined array', () => {
      const result = safeFind(undefined, x => x > 0);
      expect(result).toBeUndefined();
    });
  });

  describe('safeReduce', () => {
    it('should reduce array', () => {
      const arr = [1, 2, 3, 4];
      const result = safeReduce(arr, (sum, x) => sum + x, 0);
      expect(result).toBe(10);
    });

    it('should return initial value for empty array', () => {
      const result = safeReduce([], (sum, x) => sum + x, 0);
      expect(result).toBe(0);
    });

    it('should return initial value for undefined array', () => {
      const result = safeReduce(undefined, (sum, x) => sum + x, 0);
      expect(result).toBe(0);
    });
  });

  describe('safeSort', () => {
    it('should sort array', () => {
      const arr = [3, 1, 4, 2];
      const result = safeSort(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should not mutate original array', () => {
      const arr = [3, 1, 4, 2];
      const result = safeSort(arr);
      expect(arr).toEqual([3, 1, 4, 2]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should return empty array for undefined', () => {
      const result = safeSort(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('safeSlice', () => {
    it('should slice array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = safeSlice(arr, 1, 4);
      expect(result).toEqual([2, 3, 4]);
    });

    it('should return empty array for undefined', () => {
      const result = safeSlice(undefined, 1, 4);
      expect(result).toEqual([]);
    });
  });

  describe('safeConcat', () => {
    it('should concatenate arrays', () => {
      const result = safeConcat([1, 2], [3, 4], [5, 6]);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle undefined arrays', () => {
      const result = safeConcat([1, 2], undefined, [3, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe('safeIncludes', () => {
    it('should check if array includes item', () => {
      const arr = [1, 2, 3];
      expect(safeIncludes(arr, 2)).toBe(true);
      expect(safeIncludes(arr, 4)).toBe(false);
    });

    it('should return false for undefined array', () => {
      expect(safeIncludes(undefined, 2)).toBe(false);
    });
  });

  describe('safeUnique', () => {
    it('should return unique values', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const result = safeUnique(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array for undefined', () => {
      const result = safeUnique(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('safeGroupBy', () => {
    it('should group array by key', () => {
      const arr = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 }
      ];
      const result = safeGroupBy(arr, item => item.type);
      expect(result).toEqual({
        a: [{ type: 'a', value: 1 }, { type: 'a', value: 3 }],
        b: [{ type: 'b', value: 2 }]
      });
    });

    it('should return empty object for undefined array', () => {
      const result = safeGroupBy(undefined, item => item.type);
      expect(result).toEqual({});
    });
  });

  describe('safeEvery', () => {
    it('should check if all items satisfy condition', () => {
      const arr = [2, 4, 6, 8];
      expect(safeEvery(arr, x => x % 2 === 0)).toBe(true);
      expect(safeEvery(arr, x => x > 5)).toBe(false);
    });

    it('should return true for undefined array', () => {
      expect(safeEvery(undefined, x => x > 0)).toBe(true);
    });
  });

  describe('safeSome', () => {
    it('should check if any item satisfies condition', () => {
      const arr = [1, 3, 5, 8];
      expect(safeSome(arr, x => x % 2 === 0)).toBe(true);
      expect(safeSome(arr, x => x > 10)).toBe(false);
    });

    it('should return false for undefined array', () => {
      expect(safeSome(undefined, x => x > 0)).toBe(false);
    });
  });
});
