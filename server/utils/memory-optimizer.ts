/**
 * Memory Optimization Utilities
 * Implements caching and memory management for improved performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttlMs = 300000): void { // 5 minute default TTL
    // Remove expired items first
    this.cleanup();
    
    // If cache is full, remove oldest items
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.cache.delete(key));
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instances for different data types
export const recommendationCache = new MemoryCache<any[]>(500);
export const artworkCache = new MemoryCache<any>(1000);
export const settingsCache = new MemoryCache<any>(100);

// Memory usage monitoring
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(usage.external / 1024 / 1024 * 100) / 100} MB`,
    arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100} MB`
  };
}

// Batch processing utility for large datasets
export function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10
): Promise<R[]> {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches.reduce(async (acc, batch) => {
    const results = await acc;
    const batchResults = await Promise.all(batch.map(processor));
    return [...results, ...batchResults];
  }, Promise.resolve([] as R[]));
}

// Database query result memoization
export function memoizeQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  ttlMs = 300000
): () => Promise<T> {
  const cache = new MemoryCache<T>(100);
  
  return async (): Promise<T> => {
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await queryFn();
    cache.set(cacheKey, result, ttlMs);
    return result;
  };
}