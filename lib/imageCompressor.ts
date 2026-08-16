/**
 * High-Fidelity Client-Side Image Compression Helper
 * Resizes and compresses payment proof images while keeping text (account numbers, names, amounts) crisp and unblurred.
 */
export async function compressPaymentProof(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ compressedFile: File; originalSizeKB: number; compressedSizeKB: number }> {
  const originalSizeKB = Math.round(file.size / 1024);

  // If already a small file under 300KB and JPEG/PNG, no heavy compression needed
  if (file.size <= 300 * 1024) {
    return {
      compressedFile: file,
      originalSizeKB,
      compressedSizeKB: originalSizeKB,
    };
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      image.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);

    image.onload = () => {
      let width = image.width;
      let height = image.height;

      // Compute proportional scaling while keeping high HD resolution
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
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

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback if canvas context fails
        resolve({ compressedFile: file, originalSizeKB, compressedSizeKB: originalSizeKB });
        return;
      }

      // High quality smoothing for crisp text rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ compressedFile: file, originalSizeKB, compressedSizeKB: originalSizeKB });
            return;
          }

          const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg';
          const compressedFile = new File([blob], compressedFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          const compressedSizeKB = Math.round(compressedFile.size / 1024);

          resolve({
            compressedFile,
            originalSizeKB,
            compressedSizeKB,
          });
        },
        'image/jpeg',
        quality
      );
    };

    image.onerror = (err) => reject(err);

    reader.readAsDataURL(file);
  });
}
