export type ImageOptimizePreset = 'thumbnail' | 'prompt' | 'reference' | 'logo' | 'aistudio';

type OptimizeOptions = {
  maxSizeKB: number;
  maxDimension: number;
  /** Scale to this exact width (aspect ratio preserved); maxDimension then acts as a height cap. */
  targetWidth?: number;
  minQuality?: number;
  startQuality?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
};

// Size caps are backstops for pathological files, not the quality driver:
// dimensions + startQuality do the real work and the quality loop should
// rarely engage. Visitors get edge-resized variants anyway, so originals can
// stay high-quality (Cloudflare Transformations handles per-device delivery).
const presets: Record<ImageOptimizePreset, OptimizeOptions> = {
  thumbnail: { maxSizeKB: 250, targetWidth: 720, maxDimension: 1100, startQuality: 0.82, minQuality: 0.6, mimeType: 'image/webp' },
  prompt: { maxSizeKB: 1200, maxDimension: 1600, startQuality: 0.85, minQuality: 0.6, mimeType: 'image/webp' },
  reference: { maxSizeKB: 1600, maxDimension: 1600, startQuality: 0.85, minQuality: 0.6, mimeType: 'image/webp' },
  logo: { maxSizeKB: 120, maxDimension: 240, startQuality: 0.85, minQuality: 0.6, mimeType: 'image/webp' },
  aistudio: { maxSizeKB: 1400, maxDimension: 1600, startQuality: 0.85, minQuality: 0.6, mimeType: 'image/webp' },
};

function outputName(fileName: string, mimeType: string) {
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  return fileName.replace(/\.[^.]+$/, '') + `.${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Image compression failed'));
    }, mimeType, quality);
  });
}

export type OptimizedImage = {
  file: File;
  /** Intrinsic pixel dimensions of the returned `file`. 0 when input is not an image. */
  width: number;
  height: number;
};

// Same pipeline as optimizeImageFile, but also reports the intrinsic pixel
// dimensions of the file it returns. The dimensions always match the returned
// file: scaled dims when re-encoded, original dims when the source is returned
// unchanged. Callers persist these to reserve the layout box before load.
export async function optimizeImageFileWithMeta(
  file: File,
  preset: ImageOptimizePreset = 'prompt'
): Promise<OptimizedImage> {
  if (!file.type.startsWith('image/')) return { file, width: 0, height: 0 };

  const options = presets[preset];
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = objectUrl;
    await img.decode();

    const origWidth = img.width;
    const origHeight = img.height;
    let width = origWidth;
    let height = origHeight;
    if (options.targetWidth) {
      // Fixed-width scaling: consistent widths across aspect ratios, with
      // maxDimension as a height backstop for extreme portraits.
      const ratio = Math.min(options.targetWidth / width, options.maxDimension / height, 1);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    } else if (width > options.maxDimension || height > options.maxDimension) {
      const ratio = Math.min(options.maxDimension / width, options.maxDimension / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: options.mimeType === 'image/webp' });
    if (!ctx) return { file, width: origWidth, height: origHeight };

    if (options.mimeType === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    let quality = options.startQuality ?? 0.8;
    let blob = await canvasToBlob(canvas, options.mimeType || 'image/webp', quality);

    while (blob.size > options.maxSizeKB * 1024 && quality > (options.minQuality ?? 0.4)) {
      quality = Math.max((options.minQuality ?? 0.4), quality - 0.08);
      blob = await canvasToBlob(canvas, options.mimeType || 'image/webp', quality);
    }

    // Re-encoded output is larger than the source: keep the original file, so
    // the reported dimensions must be the original (unscaled) ones too.
    if (blob.size >= file.size && file.type !== 'image/png') {
      return { file, width: origWidth, height: origHeight };
    }

    const outFile = new File([blob], outputName(file.name, blob.type), {
      type: blob.type,
      lastModified: Date.now(),
    });
    return { file: outFile, width, height };
  } catch (error) {
    console.warn('Image optimization skipped:', error);
    return { file, width: 0, height: 0 };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function optimizeImageFile(file: File, preset: ImageOptimizePreset = 'prompt') {
  const { file: optimized } = await optimizeImageFileWithMeta(file, preset);
  return optimized;
}

export async function optimizeImageToDataUrl(file: File, preset: ImageOptimizePreset = 'prompt') {
  const optimized = await optimizeImageFile(file, preset);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(optimized);
  });
}
