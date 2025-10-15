import imageCompression from 'browser-image-compression';

export async function compressImage(file: File, maxSizeMB = 0.2, maxWidthOrHeight = 800): Promise<File> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.7
  };
  
  try {
    let compressed = await imageCompression(file, options);
    
    // If still too large, compress more aggressively
    if (compressed.size > maxSizeMB * 1024 * 1024) {
      compressed = await imageCompression(file, {
        ...options,
        initialQuality: 0.5,
        maxSizeMB: maxSizeMB * 0.7,
        maxWidthOrHeight: 600
      });
    }
    
    // Final fallback - very aggressive compression
    if (compressed.size > maxSizeMB * 1024 * 1024) {
      compressed = await imageCompression(file, {
        ...options,
        initialQuality: 0.3,
        maxSizeMB: 0.1,
        maxWidthOrHeight: 400
      });
    }
    
    console.log(`Image compressed: ${file.size} bytes → ${compressed.size} bytes (${Math.round((1 - compressed.size / file.size) * 100)}% reduction)`);
    
    return compressed;
  } catch (error) {
    console.warn('Compression failed, using original:', error);
    return file;
  }
}
