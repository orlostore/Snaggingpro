/**
 * Re-encode any image File / Blob to WebP, scaled to a sensible max
 * dimension. Everything that captures a photo (camera, gallery, baked
 * annotation) runs through here before going to IndexedDB.
 *
 * WebP is widely supported (iOS 14+, all evergreen browsers) and ~30%
 * smaller than the equivalent JPEG at the same visual quality.
 * If the browser refuses to encode WebP for some reason, we fall back
 * to JPEG so a photo is never silently lost.
 */

export interface EncodeOptions {
  /** Longest side in pixels. Default 1600 — plenty for the print report. */
  maxDimension?: number;
  /** 0–1. Default 0.82. */
  quality?: number;
}

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function reencodeToWebp(input: Blob, opts: EncodeOptions = {}): Promise<Blob> {
  const maxDim = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.82;

  let img: HTMLImageElement;
  try {
    img = await loadImage(input);
  } catch {
    return input; // unreadable — keep original blob
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > maxDim ? maxDim / longest : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return input;
  ctx.drawImage(img, 0, 0, w, h);

  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp && webp.size > 0) return webp;

  // Fallback for browsers that can't encode WebP (very old Safari).
  const jpg = await canvasToBlob(canvas, 'image/jpeg', quality);
  return jpg ?? input;
}
