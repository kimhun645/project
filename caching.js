import NodeCache from 'node-cache';

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects for better performance
});

// Cache middleware factory
export const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.method}:${req.originalUrl}`;
    const cachedData = cache.get(key);

    if (cachedData) {
      console.log(`Cache hit for ${key}`);
      return res.json(cachedData);
    }

    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (data) => {
      // Cache the response data
      cache.set(key, data, ttl);
      console.log(`Cached response for ${key} (TTL: ${ttl}s)`);
      
      // Call original res.json
      return originalJson(data);
    };

    next();
  };
};

// Cache manager class
export class CacheManager {
  constructor() {
    this.cache = cache;
  }

  // Get cached data
  get(key) {
    return this.cache.get(key);
  }

  // Set cached data
  set(key, data, ttl = 300) {
    return this.cache.set(key, data, ttl);
  }

  // Delete specific key
  del(key) {
    return this.cache.del(key);
  }

  // Delete multiple keys by pattern
  invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    if (matchingKeys.length > 0) {
      this.cache.del(matchingKeys);
      console.log(`Invalidated ${matchingKeys.length} cache keys matching pattern: ${pattern}`);
    }
    
    return matchingKeys.length;
  }

  // Clear all cache
  flush() {
    this.cache.flushAll();
    console.log('All cache cleared');
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats();
  }

  // Get all cache keys
  getKeys() {
    return this.cache.keys();
  }
}

// Create cache manager instance
export const cacheManager = new CacheManager();

