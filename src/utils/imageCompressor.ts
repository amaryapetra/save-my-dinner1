/**
 * Client-side image compression utility.
 * Optimizes photos taken on high-res smartphone cameras (iPhone/Android)
 * down to ~200-400KB while preserving high visual fidelity for culinary AI analysis.
 */

export interface CompressionResult {
  base64: string;
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  originalSizeKB: number;
  compressedSizeKB: number;
}

export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    let originalSizeKB = 0;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoadedImage = () => {
      try {
        let { width, height } = img;

        // Downscale while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) {
          reject(new Error('Failed to create canvas 2D context'));
          return;
        }

        // Draw image onto canvas with high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1];
        const compressedBytes = Math.round((base64.length * 3) / 4);
        const compressedSizeKB = Math.round(compressedBytes / 1024);

        resolve({
          base64,
          dataUrl,
          mimeType,
          width,
          height,
          originalSizeKB,
          compressedSizeKB,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof fileOrDataUrl === 'string') {
      originalSizeKB = Math.round(fileOrDataUrl.length / 1024);
      img.onload = handleLoadedImage;
      img.src = fileOrDataUrl;
    } else {
      originalSizeKB = Math.round(fileOrDataUrl.size / 1024);
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = handleLoadedImage;
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
