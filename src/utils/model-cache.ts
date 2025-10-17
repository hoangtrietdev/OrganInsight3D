/**
 * 3D Model Cache Utility
 * 
 * Caches AI-generated 3D models in browser localStorage to:
 * - Reduce API calls and costs
 * - Speed up repeat visualizations
 * - Enable offline access to previously generated models
 * 
 * Cache Structure:
 * {
 *   cacheKey: {
 *     organName: string;
 *     score: number;
 *     service: 'meshy' | 'huggingface';
 *     modelUrl: string;           // URL to download model
 *     modelData?: string;          // Base64 encoded model data (optional)
 *     timestamp: number;           // When cached
 *     expiresAt: number;           // Expiration timestamp
 *     fileSize?: number;           // Size in bytes
 *   }
 * }
 */

export interface CachedModel {
  organName: string;
  score: number;
  service: 'meshy' | 'huggingface';
  modelUrl: string;
  modelData?: string; // Base64 encoded GLB/OBJ data
  timestamp: number;
  expiresAt: number;
  fileSize?: number;
  thumbnailUrl?: string;
}

const CACHE_PREFIX = 'organ_model_cache_';
const CACHE_INDEX_KEY = 'organ_model_cache_index';
const CACHE_EXPIRY_DAYS = 7; // Models expire after 7 days
const MAX_CACHE_SIZE_MB = 50; // Maximum 50MB cache size

/**
 * Generate cache key from organ name, score, and service
 */
export function generateCacheKey(organName: string, score: number, service: string): string {
  return `${organName.toLowerCase()}_${score}_${service}`;
}

/**
 * Get cache index (list of all cached model keys)
 */
function getCacheIndex(): string[] {
  try {
    const index = localStorage.getItem(CACHE_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Failed to get cache index:', error);
    return [];
  }
}

/**
 * Update cache index
 */
function updateCacheIndex(keys: string[]): void {
  try {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to update cache index:', error);
  }
}

/**
 * Add key to cache index
 */
function addToCacheIndex(key: string): void {
  const index = getCacheIndex();
  if (!index.includes(key)) {
    index.push(key);
    updateCacheIndex(index);
  }
}

/**
 * Remove key from cache index
 */
function removeFromCacheIndex(key: string): void {
  const index = getCacheIndex();
  const updatedIndex = index.filter(k => k !== key);
  updateCacheIndex(updatedIndex);
}

/**
 * Calculate total cache size in MB
 */
export function getCacheSize(): number {
  const index = getCacheIndex();
  let totalSize = 0;
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(CACHE_PREFIX + key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    } catch (error) {
      console.error(`Failed to calculate size for ${key}:`, error);
    }
  }
  
  return totalSize / (1024 * 1024); // Convert to MB
}

/**
 * Check if cache is full
 */
function isCacheFull(): boolean {
  return getCacheSize() >= MAX_CACHE_SIZE_MB;
}

/**
 * Remove oldest cached model to make space
 */
function evictOldestModel(): void {
  const index = getCacheIndex();
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(CACHE_PREFIX + key);
      if (data) {
        const model: CachedModel = JSON.parse(data);
        if (model.timestamp < oldestTime) {
          oldestTime = model.timestamp;
          oldestKey = key;
        }
      }
    } catch (error) {
      console.error(`Failed to check model ${key}:`, error);
    }
  }
  
  if (oldestKey) {
    console.log(`Evicting oldest model: ${oldestKey}`);
    deleteCachedModel(oldestKey);
  }
}

/**
 * Save model to cache
 */
export async function cacheModel(
  organName: string,
  score: number,
  service: 'meshy' | 'huggingface',
  modelUrl: string,
  modelData?: string
): Promise<boolean> {
  const cacheKey = generateCacheKey(organName, score, service);
  
  try {
    // Check if cache is full, evict if necessary
    while (isCacheFull()) {
      evictOldestModel();
    }
    
    const now = Date.now();
    const expiresAt = now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    const cachedModel: CachedModel = {
      organName,
      score,
      service,
      modelUrl,
      modelData,
      timestamp: now,
      expiresAt,
      fileSize: modelData ? new Blob([modelData]).size : undefined,
    };
    
    localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(cachedModel));
    addToCacheIndex(cacheKey);
    
    console.log(`✅ Cached model: ${cacheKey} (expires in ${CACHE_EXPIRY_DAYS} days)`);
    return true;
  } catch (error) {
    console.error('Failed to cache model:', error);
    
    // If quota exceeded, try clearing old models
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.log('Storage quota exceeded, clearing old models...');
      clearExpiredModels();
      
      // Try one more time
      try {
        const now = Date.now();
        const expiresAt = now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        const cachedModel: CachedModel = {
          organName,
          score,
          service,
          modelUrl,
          timestamp: now,
          expiresAt,
        };
        
        localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(cachedModel));
        addToCacheIndex(cacheKey);
        return true;
      } catch (retryError) {
        console.error('Failed to cache model even after cleanup:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Get cached model
 */
export function getCachedModel(
  organName: string,
  score: number,
  service: 'meshy' | 'huggingface'
): CachedModel | null {
  const cacheKey = generateCacheKey(organName, score, service);
  
  try {
    const data = localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!data) {
      return null;
    }
    
    const cachedModel: CachedModel = JSON.parse(data);
    
    // Check if expired
    if (Date.now() > cachedModel.expiresAt) {
      console.log(`Cache expired for ${cacheKey}, removing...`);
      deleteCachedModel(cacheKey);
      return null;
    }
    
    console.log(`✅ Found cached model: ${cacheKey}`);
    return cachedModel;
  } catch (error) {
    console.error('Failed to get cached model:', error);
    return null;
  }
}

/**
 * Delete specific cached model
 */
export function deleteCachedModel(cacheKey: string): boolean {
  try {
    localStorage.removeItem(CACHE_PREFIX + cacheKey);
    removeFromCacheIndex(cacheKey);
    console.log(`Deleted cached model: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error('Failed to delete cached model:', error);
    return false;
  }
}

/**
 * Get all cached models
 */
export function getAllCachedModels(): Array<CachedModel & { cacheKey: string }> {
  const index = getCacheIndex();
  const models: Array<CachedModel & { cacheKey: string }> = [];
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(CACHE_PREFIX + key);
      if (data) {
        const model: CachedModel = JSON.parse(data);
        
        // Skip expired models
        if (Date.now() <= model.expiresAt) {
          models.push({ ...model, cacheKey: key });
        } else {
          // Clean up expired model
          deleteCachedModel(key);
        }
      }
    } catch (error) {
      console.error(`Failed to load model ${key}:`, error);
    }
  }
  
  // Sort by timestamp (newest first)
  return models.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clear all expired models
 */
export function clearExpiredModels(): number {
  const index = getCacheIndex();
  let clearedCount = 0;
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(CACHE_PREFIX + key);
      if (data) {
        const model: CachedModel = JSON.parse(data);
        
        if (Date.now() > model.expiresAt) {
          deleteCachedModel(key);
          clearedCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to check model ${key}:`, error);
    }
  }
  
  console.log(`Cleared ${clearedCount} expired models`);
  return clearedCount;
}

/**
 * Clear all cached models
 */
export function clearAllCache(): boolean {
  try {
    const index = getCacheIndex();
    
    for (const key of index) {
      localStorage.removeItem(CACHE_PREFIX + key);
    }
    
    localStorage.removeItem(CACHE_INDEX_KEY);
    console.log('Cleared all cached models');
    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export interface CacheStats {
  totalModels: number;
  totalSizeMB: number;
  maxSizeMB: number;
  utilizationPercent: number;
  oldestModelDate: Date | null;
  newestModelDate: Date | null;
  modelsByService: {
    meshy: number;
    huggingface: number;
  };
}

export function getCacheStats(): CacheStats {
  const models = getAllCachedModels();
  const sizeMB = getCacheSize();
  
  const stats: CacheStats = {
    totalModels: models.length,
    totalSizeMB: Math.round(sizeMB * 100) / 100,
    maxSizeMB: MAX_CACHE_SIZE_MB,
    utilizationPercent: Math.round((sizeMB / MAX_CACHE_SIZE_MB) * 100),
    oldestModelDate: null,
    newestModelDate: null,
    modelsByService: {
      meshy: 0,
      huggingface: 0,
    },
  };
  
  if (models.length > 0) {
    stats.oldestModelDate = new Date(models[models.length - 1].timestamp);
    stats.newestModelDate = new Date(models[0].timestamp);
    
    for (const model of models) {
      if (model.service === 'meshy') {
        stats.modelsByService.meshy++;
      } else if (model.service === 'huggingface') {
        stats.modelsByService.huggingface++;
      }
    }
  }
  
  return stats;
}
