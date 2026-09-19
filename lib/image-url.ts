type ThumbnailOptions = {
  width?: number;
  quality?: number | string;
  fit?: 'scale-down' | 'contain' | 'cover';
};

const DEFAULT_SITE_ORIGIN = 'https://promptsoul.in';
const DEFAULT_UPLOAD_ORIGIN = 'https://uploads.aipromptmatrix.in';
const RESIZE_ELIGIBLE_HOSTS = new Set([
  'promptsoul.in',
  'www.promptsoul.in',
  'aipromptmatrix.in',
  'www.aipromptmatrix.in',
]);

function getUploadOrigin() {
  return (process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || DEFAULT_UPLOAD_ORIGIN).replace(/\/$/, '');
}

function getResizeOrigin() {
  if (process.env.NEXT_PUBLIC_ENABLE_CLOUDFLARE_IMAGE_RESIZE !== 'true') {
    return '';
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN;
  try {
    const siteUrl = new URL(rawSiteUrl);
    if (siteUrl.protocol !== 'https:') return '';
    if (!RESIZE_ELIGIBLE_HOSTS.has(siteUrl.hostname)) return '';
    return siteUrl.origin;
  } catch {
    return '';
  }
}

function normalizeImageUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;

  try {
    // Already an absolute URL.
    return new URL(trimmed).toString();
  } catch {
    // Older CMS/upload values can be stored as bare R2 keys/filenames
    // (`thumbnails/x.webp`, `thumbnail-x.webp`, etc.). Resolve those to the
    // public upload domain before handing them to Cloudflare image resizing.
    return `${getUploadOrigin()}/${trimmed.replace(/^\/+/, '')}`;
  }
}

export function unwrapCloudflareImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const match = trimmed.match(/(?:^|https?:\/\/[^/]+)?\/cdn-cgi\/image\/[^/]+\/(.+)$/);
  if (match) {
    return match[1];
  }
  return trimmed;
}

function canResizeImage(url: string) {
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  if (url.includes('/cdn-cgi/image/')) return false;
  if (/\.svg(?:[?#].*)?$/i.test(url)) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    // Relative paths like /api/image/:id stay untouched so local preview and
    // dynamic fallbacks keep working.
    return false;
  }
}

export function getCloudflareImageUrl(url?: string, options: ThumbnailOptions = {}) {
  if (!url) return '';
  const unwrapped = unwrapCloudflareImageUrl(url);
  const trimmed = normalizeImageUrl(unwrapped);
  if (!canResizeImage(trimmed)) return trimmed;

  const resizeOrigin = getResizeOrigin();
  if (!resizeOrigin) return trimmed;

  const params = [
    options.width ? `width=${Math.max(1, Math.round(options.width))}` : '',
    `quality=${options.quality ?? 76}`,
    'format=auto',
    `fit=${options.fit ?? 'scale-down'}`,
  ].filter(Boolean);

  return `${resizeOrigin}/cdn-cgi/image/${params.join(',')}/${trimmed}`;
}

export function getThumbnailImageUrl(url?: string, options: ThumbnailOptions = {}) {
  return getCloudflareImageUrl(url, {
    width: options.width ?? 380,
    quality: options.quality ?? 74,
    fit: options.fit ?? 'scale-down',
  });
}

export function getThumbnailSrcSet(
  url?: string,
  widths: number[] = [240, 360, 480, 720],
  quality = 74
): string | undefined {
  if (!url) return undefined;
  const unwrapped = unwrapCloudflareImageUrl(url);
  const trimmed = normalizeImageUrl(unwrapped);
  if (!canResizeImage(trimmed) || !getResizeOrigin()) return undefined;

  return widths
    .map((w) => `${getThumbnailImageUrl(trimmed, { width: w, quality })} ${w}w`)
    .join(', ');
}

export function getPromptImageUrl(url?: string, options: ThumbnailOptions = {}) {
  return getCloudflareImageUrl(url, {
    width: options.width ?? 1200,
    quality: options.quality ?? 74,
    fit: options.fit ?? 'scale-down',
  });
}

export function getArticleImageUrl(url?: string, options: ThumbnailOptions = {}) {
  return getCloudflareImageUrl(url, {
    width: options.width ?? 760,
    quality: options.quality ?? 74,
    fit: options.fit ?? 'scale-down',
  });
}

