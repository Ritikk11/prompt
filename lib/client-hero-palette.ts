'use client';

import type { HeroPalette } from './types';

type Rgb = { r: number; g: number; b: number };
type Bucket = Rgb & { count: number };

function channelToHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

function toHex(color: Rgb) {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
}

function saturation({ r, g, b }: Rgb) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function luminance({ r, g, b }: Rgb) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function distance(a: Rgb, b: Rgb) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function darken(color: Rgb): Rgb {
  const light = luminance(color);
  const factor = light > 0.55 ? 0.24 : light > 0.3 ? 0.34 : 0.52;
  return { r: color.r * factor, g: color.g * factor, b: color.b * factor };
}

function paletteFromPixels(data: Uint8ClampedArray): HeroPalette | undefined {
  const buckets = new Map<string, Bucket>();
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalWeight = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    if (alpha < 0.5) continue;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const light = luminance({ r, g, b });
    if (light < 0.025 || light > 0.985) continue;

    totalR += r * alpha;
    totalG += g * alpha;
    totalB += b * alpha;
    totalWeight += alpha;

    const qr = Math.min(240, Math.round(r / 24) * 24);
    const qg = Math.min(240, Math.round(g / 24) * 24);
    const qb = Math.min(240, Math.round(b / 24) * 24);
    const key = `${qr},${qg},${qb}`;
    const current = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    current.r += r;
    current.g += g;
    current.b += b;
    current.count += 1;
    buckets.set(key, current);
  }

  if (!totalWeight || buckets.size === 0) return undefined;

  const candidates = Array.from(buckets.values())
    .map(bucket => ({
      color: { r: bucket.r / bucket.count, g: bucket.g / bucket.count, b: bucket.b / bucket.count },
      count: bucket.count,
    }))
    .filter(({ color }) => luminance(color) > 0.08 && luminance(color) < 0.92)
    .sort((a, b) => {
      const score = (entry: typeof a) => entry.count * (0.65 + saturation(entry.color) * 1.35);
      return score(b) - score(a);
    });

  const average = { r: totalR / totalWeight, g: totalG / totalWeight, b: totalB / totalWeight };
  const primary = candidates[0]?.color || average;
  const secondary = candidates.find(candidate => distance(primary, candidate.color) >= 72)?.color
    || candidates[1]?.color
    || average;

  return {
    primary: toHex(primary),
    secondary: toHex(secondary),
    background: toHex(darken(average)),
  };
}

async function loadImage(source: File | string) {
  const objectUrl = source instanceof File ? URL.createObjectURL(source) : null;
  const image = new window.Image();
  image.decoding = 'async';
  if (!objectUrl) image.crossOrigin = 'anonymous';
  image.src = objectUrl || String(source);
  try {
    await image.decode();
    return image;
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function extractHeroPalette(source: File | string): Promise<HeroPalette | undefined> {
  if (!source) return undefined;
  let image: HTMLImageElement | undefined;
  let objectUrl: string | undefined;
  try {
    image = await loadImage(source);
    if (source instanceof File) objectUrl = image.src;
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return paletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data);
  } catch (error) {
    console.warn('Hero palette extraction skipped:', error);
    return undefined;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
