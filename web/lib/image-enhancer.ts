/**
 * Client-Side Image Pre-processing for Google-Standard Vision OCR and Storage
 * - Automatically balances contrast & brightness for faint pencil handwriting on notebook paper
 * - Compresses thumbnails for LocalStorage archive so memory never exhausts
 */

export async function enhanceDocumentImage(dataUrl: string): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Apply slight contrast and brightness boost for faint pencil marks & paper shadows
        ctx.filter = 'contrast(1.18) brightness(1.04)';
        ctx.drawImage(img, 0, 0);

        // Export at high quality for AI vision scanning
        const enhanced = canvas.toDataURL('image/jpeg', 0.92);
        resolve(enhanced);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function compressImageForThumbnail(
  dataUrl: string,
  maxDim: number = 320,
  quality: number = 0.6
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const thumb = canvas.toDataURL('image/jpeg', quality);
        resolve(thumb);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
