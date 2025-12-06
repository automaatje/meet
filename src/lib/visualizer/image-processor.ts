import type { DetectedObject } from './types';

export interface VisualizationOverlay {
  objectId: string;
  productImageUrl: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export async function generateVisualization(
  originalImageUrl: string,
  overlays: VisualizationOverlay[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const originalImage = new Image();
    originalImage.crossOrigin = 'anonymous';

    originalImage.onload = async () => {
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      ctx.drawImage(originalImage, 0, 0);

      try {
        for (const overlay of overlays) {
          const productImage = await loadImage(overlay.productImageUrl);

          ctx.save();
          ctx.globalAlpha = 0.85;

          ctx.drawImage(
            productImage,
            overlay.bounds.x,
            overlay.bounds.y,
            overlay.bounds.width,
            overlay.bounds.height
          );

          ctx.restore();
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    originalImage.onerror = () => {
      reject(new Error('Failed to load original image'));
    };

    originalImage.src = originalImageUrl;
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

    img.src = url;
  });
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

export async function uploadVisualization(
  blob: Blob,
  projectId: string,
  userId: string
): Promise<string> {
  const { supabase } = await import('../supabase');

  const fileName = `${projectId}-${Date.now()}.jpg`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('visualization-photos')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('visualization-photos')
    .getPublicUrl(filePath);

  return publicUrl;
}
