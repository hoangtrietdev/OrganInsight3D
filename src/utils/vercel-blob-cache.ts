/**
 * Vercel Blob Storage Model Cache Utility
 * 
 * This utility handles loading GLB models from Vercel Blob Storage
 * - Direct CDN access with no restrictions
 * - Fast global delivery
 * - No file size limits
 * - Works seamlessly in Vercel deployment
 */

// Vercel Blob Storage public URL
const VERCEL_BLOB_BASE_URL = process.env.NEXT_PUBLIC_VERCEL_BLOB_URL || 'https://nhewuyihqt8z4wwu.public.blob.vercel-storage.com';

/**
 * Model filename mapping
 * Maps model names (e.g., "brain1", "lung3") to their filenames
 * All files are stored in Vercel Blob Storage with consistent naming
 */
interface ModelFileNames {
  [key: string]: string;
}

// Model name to filename mapping (all stored in Vercel Blob)
const MODEL_FILE_NAMES: ModelFileNames = {
  // Brain models (1-5 severity scores)
  'brain1': 'brain1.glb',
  'brain2': 'brain2.glb',
  'brain3': 'brain3.glb',
  'brain4': 'brain4.glb',
  'brain5': 'brain5.glb',
  
  // Heart models (1-5 severity scores)
  'heart1': 'heart1.glb',
  'heart2': 'heart2.glb',
  'heart3': 'heart3.glb',
  'heart4': 'heart4.glb',
  'heart5': 'heart5.glb',
  
  // Lung models (1-5 severity scores)
  'lung1': 'lung1.glb',
  'lung2': 'lung2.glb',
  'lung3': 'lung3.glb',
  'lung4': 'lung4.glb',
  'lung5': 'lung5.glb',
  
  // Liver models (1-5 severity scores)
  'liver1': 'liver1.glb',
  'liver2': 'liver2.glb',
  'liver3': 'liver3.glb',
  'liver4': 'liver4.glb',
  'liver5': 'liver5.glb',
  
  // Kidney models (1-5 severity scores)
  'kidney1': 'kidney1.glb',
  'kidney2': 'kidney2.glb',
  'kidney3': 'kidney3.glb',
  'kidney4': 'kidney4.glb',
  'kidney5': 'kidney5.glb',
  
  // Stomach models (1-5 severity scores)
  'stomach1': 'stomach1.glb',
  'stomach2': 'stomach2.glb',
  'stomach3': 'stomach3.glb',
  'stomach4': 'stomach4.glb',
  'stomach5': 'stomach5.glb',
};

/**
 * Get Vercel Blob Storage URL for a model file
 * @param fileName The name of the GLB file (e.g., "brain1.glb")
 * @returns Full URL to the file in Vercel Blob Storage
 */
function getVercelBlobUrl(fileName: string): string {
  return `${VERCEL_BLOB_BASE_URL}/${fileName}`;
}

/**
 * Get local fallback URL
 * @param fileName The name of the GLB file
 * @returns Local file path
 */
function getLocalUrl(fileName: string): string {
  return `/models/glb/${fileName}`;
}

/**
 * Get model URL from Vercel Blob Storage
 * @param organName Name of the organ (e.g., "Brain", "Lung")
 * @param score Severity score (1-5)
 * @returns Vercel Blob URL or null if not found
 */
export function getModelUrl(organName: string, score: number): string | null {
  const modelKey = `${organName.toLowerCase()}${score}`;
  const fileName = MODEL_FILE_NAMES[modelKey];
  
  if (!fileName) {
    console.warn(`No filename found for model: ${modelKey}`);
    return null;
  }
  
  return getVercelBlobUrl(fileName);
}

/**
 * Get multiple URL formats for fallback loading
 * @param organName Name of the organ
 * @param score Severity score (1-5)
 * @returns Array of URLs to try in order
 */
export function getModelUrls(organName: string, score: number): string[] {
  const modelKey = `${organName.toLowerCase()}${score}`;
  const fileName = MODEL_FILE_NAMES[modelKey];
  
  if (!fileName) {
    return [];
  }
  
  // Try Vercel Blob first, then local fallback
  return [
    // Vercel Blob Storage (primary)
    getVercelBlobUrl(fileName),
    // Local fallback
    getLocalUrl(fileName),
  ];
}

/**
 * Get the filename for a model
 * @param organName Name of the organ
 * @param score Severity score (1-5)
 * @returns Filename or null if not found
 */
export function getFileName(organName: string, score: number): string | null {
  const modelKey = `${organName.toLowerCase()}${score}`;
  return MODEL_FILE_NAMES[modelKey] || null;
}

/**
 * Check if a model exists in the mapping
 * @param organName Name of the organ
 * @param score Severity score (1-5)
 * @returns true if model filename exists
 */
export function modelExists(organName: string, score: number): boolean {
  const modelKey = `${organName.toLowerCase()}${score}`;
  return !!MODEL_FILE_NAMES[modelKey];
}

/**
 * Get all available models
 * @returns Array of available model keys
 */
export function getAvailableModels(): string[] {
  return Object.keys(MODEL_FILE_NAMES);
}

/**
 * Preload a model from Vercel Blob Storage (optional optimization)
 * @param organName Name of the organ
 * @param score Severity score (1-5)
 */
export async function preloadModel(organName: string, score: number): Promise<void> {
  const url = getModelUrl(organName, score);
  if (!url) {
    throw new Error(`Model not found: ${organName}${score}`);
  }
  
  try {
    // Check if file is accessible
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Failed to access model: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error preloading model ${organName}${score}:`, error);
    throw error;
  }
}

/**
 * Get the Vercel Blob Storage base URL
 * @returns Vercel Blob base URL
 */
export function getBlobBaseUrl(): string {
  return VERCEL_BLOB_BASE_URL;
}
