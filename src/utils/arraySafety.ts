// Array Safety Utilities
// Helper functions to prevent "map is not a function" errors

/**
 * Ensures a value is an array, returns empty array if not
 */
export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  // If it's a single value, wrap it in an array
  return [value];
}

/**
 * Safely maps over an array, returns empty array if not an array
 */
export function safeMap<T, U>(
  array: T[] | undefined | null,
  mapper: (item: T, index: number) => U
): U[] {
  const safeArray = ensureArray(array);
  return safeArray.map(mapper);
}

/**
 * Safely filters an array, returns empty array if not an array
 */
export function safeFilter<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean
): T[] {
  const safeArray = ensureArray(array);
  return safeArray.filter(predicate);
}

/**
 * Safely gets array length, returns 0 if not an array
 */
export function safeLength<T>(array: T[] | undefined | null): number {
  return ensureArray(array).length;
}

/**
 * Safely checks if array is empty
 */
export function safeIsEmpty<T>(array: T[] | undefined | null): boolean {
  return safeLength(array) === 0;
}

/**
 * Safely gets array item by index
 */
export function safeGet<T>(array: T[] | undefined | null, index: number): T | undefined {
  const safeArray = ensureArray(array);
  return safeArray[index];
}

/**
 * Safely finds item in array
 */
export function safeFind<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean
): T | undefined {
  const safeArray = ensureArray(array);
  return safeArray.find(predicate);
}

/**
 * Safely reduces an array
 */
export function safeReduce<T, U>(
  array: T[] | undefined | null,
  reducer: (accumulator: U, currentValue: T, currentIndex: number) => U,
  initialValue: U
): U {
  const safeArray = ensureArray(array);
  return safeArray.reduce(reducer, initialValue);
}

/**
 * Safely sorts an array
 */
export function safeSort<T>(
  array: T[] | undefined | null,
  compareFn?: (a: T, b: T) => number
): T[] {
  const safeArray = ensureArray(array);
  return [...safeArray].sort(compareFn);
}

/**
 * Safely slices an array
 */
export function safeSlice<T>(
  array: T[] | undefined | null,
  start?: number,
  end?: number
): T[] {
  const safeArray = ensureArray(array);
  return safeArray.slice(start, end);
}

/**
 * Safely concatenates arrays
 */
export function safeConcat<T>(...arrays: (T[] | undefined | null)[]): T[] {
  return arrays.reduce((acc, arr) => {
    return acc.concat(ensureArray(arr));
  }, [] as T[]);
}

/**
 * Safely checks if array includes an item
 */
export function safeIncludes<T>(array: T[] | undefined | null, item: T): boolean {
  const safeArray = ensureArray(array);
  return safeArray.includes(item);
}

/**
 * Safely gets unique values from array
 */
export function safeUnique<T>(array: T[] | undefined | null): T[] {
  const safeArray = ensureArray(array);
  return [...new Set(safeArray)];
}

/**
 * Safely groups array by key
 */
export function safeGroupBy<T, K extends string | number | symbol>(
  array: T[] | undefined | null,
  keyFn: (item: T) => K
): Record<K, T[]> {
  const safeArray = ensureArray(array);
  return safeArray.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

/**
 * Safely checks if all items in array satisfy condition
 */
export function safeEvery<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean
): boolean {
  const safeArray = ensureArray(array);
  return safeArray.every(predicate);
}

/**
 * Safely checks if any item in array satisfies condition
 */
export function safeSome<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean
): boolean {
  const safeArray = ensureArray(array);
  return safeArray.some(predicate);
}
