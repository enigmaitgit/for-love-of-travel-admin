// Image URL resolution utilities

const MEDIA_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Resolves image URLs to proper URLs, handling various formats:
 * - Full URLs (http/https) - returns as-is
 * - Data URLs (data:) - converts to placeholder or removes (to prevent payload bloat)
 * - File IDs/filenames - constructs proper URL
 * - Empty/undefined values - returns empty string
 */
export const resolveImage = (val?: string): string => {
  console.log('resolveImage - Input:', val);
  
  if (!val || val === 'undefined' || val.trim() === '') {
    console.log('resolveImage - Empty value, returning empty string');
    return '';
  }
  
  // If it's already a full URL, return as is
  if (val.startsWith('http')) {
    console.log('resolveImage - Full URL detected, returning as-is:', val);
    return val;
  }
  
  // If it's a data URL, return empty string to prevent payload bloat
  // In a real implementation, you might want to upload the data URL to get a proper URL
  if (val.startsWith('data:')) {
    console.warn('resolveImage - Data URL detected and removed to prevent payload bloat:', val.substring(0, 50) + '...');
    return '';
  }
  
  // Treat as file id/filename and construct URL using the serving endpoint
  // If it's a path like /uploads/filename, extract just the filename
  const filename = val.startsWith('/uploads/') ? val.replace('/uploads/', '') : val;
  const result = `${MEDIA_BASE}/v1/media/serve/${filename}`;
  console.log('resolveImage - File ID detected, constructed URL:', result);
  return result;
};

/**
 * Resolves image URL for API responses, handling both ID and URL formats
 */
export const resolveImageFromApi = (val?: string | { url?: string; id?: string }): string => {
  if (!val) return '';
  
  // Handle object format
  if (typeof val === 'object') {
    return resolveImage(val.url || val.id);
  }
  
  // Handle string format
  return resolveImage(val);
};

/**
 * Checks if an image URL is a data URL (base64)
 */
export const isDataUrl = (url: string): boolean => {
  return url.startsWith('data:');
};

/**
 * Checks if an image URL is a full HTTP URL
 */
export const isFullUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Gets a preview URL for an image, preserving data URLs for display
 * This should be used for UI previews, not for saving to backend
 */
export const getImagePreviewUrl = (url: string): string => {
  if (!url || url === 'undefined' || url.trim() === '') return '';
  
  // For preview purposes, preserve data URLs and full URLs
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  // Treat as file id/filename and construct URL using the serving endpoint
  // If it's a path like /uploads/filename, extract just the filename
  const filename = url.startsWith('/uploads/') ? url.replace('/uploads/', '') : url;
  return `${MEDIA_BASE}/v1/media/serve/${filename}`;
};

/**
 * Gets a display URL for an image, preserving data URLs for immediate display
 * This is used in editors where we need to show images even if they're data URLs
 */
export const getImageDisplayUrl = (url: string): string => {
  return getImagePreviewUrl(url);
};
