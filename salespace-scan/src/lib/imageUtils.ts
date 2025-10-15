/**
 * Utility functions for handling base64 images
 */

/**
 * Convert base64 string to a blob URL for displaying in img tags
 */
export function base64ToObjectURL(base64String: string): string {
  // Handle data URLs that already include the prefix
  if (base64String.startsWith('data:')) {
    return base64String;
  }
  
  // Add data URL prefix if not present
  return `data:image/jpeg;base64,${base64String}`;
}

/**
 * Convert base64 string to File object
 */
export function base64ToFile(base64String: string, filename: string = 'image.jpg'): File {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Convert base64 to binary
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new File([arrayBuffer], filename, { type: 'image/jpeg' });
}

/**
 * Get file size from base64 string in bytes
 */
export function getBase64FileSize(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Calculate file size (base64 is ~33% larger than binary)
  return Math.round((base64Data.length * 3) / 4);
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if a string is a valid base64 image
 */
export function isValidBase64Image(base64String: string): boolean {
  try {
    // Check if it's a data URL
    if (base64String.startsWith('data:image/')) {
      return true;
    }
    
    // Try to decode the base64 string
    const decoded = atob(base64String);
    return decoded.length > 0;
  } catch (error) {
    return false;
  }
}
