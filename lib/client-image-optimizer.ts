export type ImageOptimizePreset = 'thumbnail' | 'prompt' | 'reference' | 'logo';

type OptimizeOptions = {
  maxSizeKB: number;
  maxDimension: number;
  minQuality?: number;
  startQuality?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
};

const presets: Record<ImageOptimizePreset, OptimizeOptions> = {
  thumbnail: { maxSizeKB: 140, maxDimension: 900, startQuality: 0.76, minQuality: 0.34, mimeType: 'image/webp' },
  prompt: { maxSizeKB: 520, maxDimension: 1600, startQuality: 0.82, minQuality: 0.48, mimeType: 'image/webp' },
  reference: { maxSizeKB: 650, maxDimension: 1400, startQuality: 0.8, minQuality: 0.44, mimeType: 'image/webp' },
  logo: { maxSizeKB: 45, maxDimension: 240, startQuality: 0.82, minQuality: 0.45, mimeType: 'image/webp' },
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

export async function optimizeImageFile(file: File, preset: ImageOptimizePreset = 'prompt') {
  if (!file.type.startsWith('image/')) return file;

  const options = presets[preset];
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = objectUrl;
    await img.decode();

    let { width, height } = img;
    if (width > options.maxDimension || height > options.maxDimension) {
      const ratio = Math.min(options.maxDimension / width, options.maxDimension / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: options.mimeType === 'image/webp' });
    if (!ctx) return file;

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

    if (blob.size >= file.size && file.type !== 'image/png') return file;

    return new File([blob], outputName(file.name, blob.type), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Image optimization skipped:', error);
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
