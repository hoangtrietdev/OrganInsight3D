/**
 * Diagnosis Cache Utility
 * 
 * Caches Groq AI diagnosis results to:
 * - Reduce API calls and costs
 * - Speed up repeat analyses of similar images
 * - Provide consistent results for identical images
 * 
 * Cache Structure:
 * {
 *   cacheKey: {
 *     organName: string;
 *     imageHash: string;
 *     diagnosis: OrganDiagnosis;
 *     timestamp: number;
 *     expiresAt: number;
 *   }
 * }
 */

import { OrganDiagnosis } from '@/types/diagnosis';

export interface CachedDiagnosis {
  organName: string;
  imageHash: string; // MD5/SHA hash of image data
  diagnosis: OrganDiagnosis;
  timestamp: number;
  expiresAt: number;
}

const DIAGNOSIS_CACHE_PREFIX = 'diagnosis_cache_';
const DIAGNOSIS_CACHE_INDEX_KEY = 'diagnosis_cache_index';
const DIAGNOSIS_CACHE_EXPIRY_DAYS = 30; // Diagnoses expire after 30 days
const MAX_DIAGNOSIS_CACHE_SIZE_MB = 10; // Maximum 10MB cache size for diagnoses

/**
 * Generate a simple hash from image data
 * Uses a basic hash function with sampling from multiple parts of the image
 */
export function generateImageHash(imageData: string): string {
  let hash = 0;
  const dataLength = imageData.length;
  
  // Sample from beginning, middle, and end of the image data
  const sampleSize = 5000; // Sample 5KB from each section
  const sections = [
    imageData.substring(0, Math.min(sampleSize, dataLength)), // Beginning
    imageData.substring(Math.floor(dataLength / 2), Math.floor(dataLength / 2) + Math.min(sampleSize, dataLength)), // Middle
    imageData.substring(Math.max(0, dataLength - sampleSize), dataLength) // End
  ];
  
  // Combine all sections and include total length for uniqueness
  const str = sections.join('') + dataLength.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Generate cache key from organ name and image hash
 */
export function generateDiagnosisCacheKey(organName: string, imageHash: string): string {
  return `${organName.toLowerCase()}_${imageHash}`;
}

/**
 * Get cache index (list of all cached diagnosis keys)
 */
function getDiagnosisCacheIndex(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const index = localStorage.getItem(DIAGNOSIS_CACHE_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Failed to get diagnosis cache index:', error);
    return [];
  }
}

/**
 * Update cache index
 */
function updateDiagnosisCacheIndex(keys: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(DIAGNOSIS_CACHE_INDEX_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to update diagnosis cache index:', error);
  }
}

/**
 * Add key to cache index
 */
function addToDiagnosisCacheIndex(key: string): void {
  const index = getDiagnosisCacheIndex();
  if (!index.includes(key)) {
    index.push(key);
    updateDiagnosisCacheIndex(index);
  }
}

/**
 * Remove key from cache index
 */
function removeFromDiagnosisCacheIndex(key: string): void {
  const index = getDiagnosisCacheIndex();
  const updatedIndex = index.filter(k => k !== key);
  updateDiagnosisCacheIndex(updatedIndex);
}

/**
 * Calculate total diagnosis cache size in MB
 */
export function getDiagnosisCacheSize(): number {
  if (typeof window === 'undefined') return 0;
  
  const index = getDiagnosisCacheIndex();
  let totalSize = 0;
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(DIAGNOSIS_CACHE_PREFIX + key);
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
 * Check if diagnosis cache is full
 */
function isDiagnosisCacheFull(): boolean {
  return getDiagnosisCacheSize() >= MAX_DIAGNOSIS_CACHE_SIZE_MB;
}

/**
 * Remove oldest cached diagnosis to make space
 */
function evictOldestDiagnosis(): void {
  const index = getDiagnosisCacheIndex();
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(DIAGNOSIS_CACHE_PREFIX + key);
      if (data) {
        const cached: CachedDiagnosis = JSON.parse(data);
        if (cached.timestamp < oldestTime) {
          oldestTime = cached.timestamp;
          oldestKey = key;
        }
      }
    } catch (error) {
      console.error(`Failed to check diagnosis ${key}:`, error);
    }
  }
  
  if (oldestKey) {
    console.log(`Evicting oldest diagnosis: ${oldestKey}`);
    deleteCachedDiagnosis(oldestKey);
  }
}

/**
 * Save diagnosis to cache
 * Now uses only image hash as the key, since organ is auto-detected
 */
export function cacheDiagnosis(
  organName: string,
  imageData: string,
  diagnosis: OrganDiagnosis
): boolean {
  if (typeof window === 'undefined') return false;
  
  const imageHash = generateImageHash(imageData);
  // Use only image hash as key (organ is now auto-detected, not a search parameter)
  const cacheKey = imageHash;
  
  try {
    // Check if cache is full, evict if necessary
    while (isDiagnosisCacheFull()) {
      evictOldestDiagnosis();
    }
    
    const now = Date.now();
    const expiresAt = now + (DIAGNOSIS_CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    const cachedDiagnosis: CachedDiagnosis = {
      organName,
      imageHash,
      diagnosis,
      timestamp: now,
      expiresAt,
    };
    
    localStorage.setItem(DIAGNOSIS_CACHE_PREFIX + cacheKey, JSON.stringify(cachedDiagnosis));
    addToDiagnosisCacheIndex(cacheKey);
    
    console.log(`✅ Cached diagnosis: ${cacheKey} (${organName}, expires in ${DIAGNOSIS_CACHE_EXPIRY_DAYS} days)`);
    return true;
  } catch (error) {
    console.error('Failed to cache diagnosis:', error);
    
    // If quota exceeded, try clearing old diagnoses
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.log('Storage quota exceeded, clearing old diagnoses...');
      clearExpiredDiagnoses();
      
      // Try one more time
      try {
        const now = Date.now();
        const expiresAt = now + (DIAGNOSIS_CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        const cachedDiagnosis: CachedDiagnosis = {
          organName,
          imageHash,
          diagnosis,
          timestamp: now,
          expiresAt,
        };
        
        localStorage.setItem(DIAGNOSIS_CACHE_PREFIX + cacheKey, JSON.stringify(cachedDiagnosis));
        addToDiagnosisCacheIndex(cacheKey);
        return true;
      } catch (retryError) {
        console.error('Failed to cache diagnosis even after cleanup:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Get cached diagnosis
 * Now uses only image hash, since organ is auto-detected
 */
export function getCachedDiagnosis(
  imageData: string
): OrganDiagnosis | null {
  if (typeof window === 'undefined') return null;
  
  const imageHash = generateImageHash(imageData);
  // Use only image hash as key
  const cacheKey = imageHash;
  
  try {
    const data = localStorage.getItem(DIAGNOSIS_CACHE_PREFIX + cacheKey);
    if (!data) {
      return null;
    }
    
    const cached: CachedDiagnosis = JSON.parse(data);
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      console.log(`Diagnosis cache expired for ${cacheKey}, removing...`);
      deleteCachedDiagnosis(cacheKey);
      return null;
    }
    
    console.log(`✅ Found cached diagnosis: ${cacheKey} (${cached.organName})`);
    return cached.diagnosis;
  } catch (error) {
    console.error('Failed to get cached diagnosis:', error);
    return null;
  }
}

/**
 * Delete specific cached diagnosis
 */
export function deleteCachedDiagnosis(cacheKey: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(DIAGNOSIS_CACHE_PREFIX + cacheKey);
    removeFromDiagnosisCacheIndex(cacheKey);
    console.log(`Deleted cached diagnosis: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error('Failed to delete cached diagnosis:', error);
    return false;
  }
}

/**
 * Get all cached diagnoses
 */
export function getAllCachedDiagnoses(): Array<CachedDiagnosis & { cacheKey: string }> {
  if (typeof window === 'undefined') return [];
  
  const index = getDiagnosisCacheIndex();
  const diagnoses: Array<CachedDiagnosis & { cacheKey: string }> = [];
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(DIAGNOSIS_CACHE_PREFIX + key);
      if (data) {
        const cached: CachedDiagnosis = JSON.parse(data);
        
        // Skip expired diagnoses
        if (Date.now() <= cached.expiresAt) {
          diagnoses.push({ ...cached, cacheKey: key });
        } else {
          // Clean up expired diagnosis
          deleteCachedDiagnosis(key);
        }
      }
    } catch (error) {
      console.error(`Failed to load diagnosis ${key}:`, error);
    }
  }
  
  // Sort by timestamp (newest first)
  return diagnoses.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clear all expired diagnoses
 */
export function clearExpiredDiagnoses(): number {
  if (typeof window === 'undefined') return 0;
  
  const index = getDiagnosisCacheIndex();
  let clearedCount = 0;
  
  for (const key of index) {
    try {
      const data = localStorage.getItem(DIAGNOSIS_CACHE_PREFIX + key);
      if (data) {
        const cached: CachedDiagnosis = JSON.parse(data);
        
        if (Date.now() > cached.expiresAt) {
          deleteCachedDiagnosis(key);
          clearedCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to check diagnosis ${key}:`, error);
    }
  }
  
  console.log(`Cleared ${clearedCount} expired diagnoses`);
  return clearedCount;
}

/**
 * Clear all cached diagnoses
 */
export function clearAllDiagnosisCache(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const index = getDiagnosisCacheIndex();
    
    for (const key of index) {
      localStorage.removeItem(DIAGNOSIS_CACHE_PREFIX + key);
    }
    
    localStorage.removeItem(DIAGNOSIS_CACHE_INDEX_KEY);
    console.log('Cleared all cached diagnoses');
    return true;
  } catch (error) {
    console.error('Failed to clear diagnosis cache:', error);
    return false;
  }
}

/**
 * Get diagnosis cache statistics
 */
export interface DiagnosisCacheStats {
  totalDiagnoses: number;
  totalSizeMB: number;
  maxSizeMB: number;
  utilizationPercent: number;
  oldestDiagnosisDate: Date | null;
  newestDiagnosisDate: Date | null;
  diagnosisCountByOrgan: Record<string, number>;
}

export function getDiagnosisCacheStats(): DiagnosisCacheStats {
  const diagnoses = getAllCachedDiagnoses();
  const sizeMB = getDiagnosisCacheSize();
  
  const stats: DiagnosisCacheStats = {
    totalDiagnoses: diagnoses.length,
    totalSizeMB: Math.round(sizeMB * 100) / 100,
    maxSizeMB: MAX_DIAGNOSIS_CACHE_SIZE_MB,
    utilizationPercent: Math.round((sizeMB / MAX_DIAGNOSIS_CACHE_SIZE_MB) * 100),
    oldestDiagnosisDate: null,
    newestDiagnosisDate: null,
    diagnosisCountByOrgan: {},
  };
  
  if (diagnoses.length > 0) {
    stats.oldestDiagnosisDate = new Date(diagnoses[diagnoses.length - 1].timestamp);
    stats.newestDiagnosisDate = new Date(diagnoses[0].timestamp);
    
    for (const diagnosis of diagnoses) {
      const organ = diagnosis.organName;
      stats.diagnosisCountByOrgan[organ] = (stats.diagnosisCountByOrgan[organ] || 0) + 1;
    }
  }
  
  return stats;
}
