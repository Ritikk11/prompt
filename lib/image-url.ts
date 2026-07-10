type ThumbnailOptions = {
  width?: number;
  quality?: number | string;
  fit?: 'scale-down' | 'contain' | 'cover';
};

const DEFAULT_SITE_ORIGIN = 'https://aipromptmatrix.in';
const RESIZE_ELIGIBLE_HOSTS = new Set([
  'aipromptmatrix.in',
  'www.aipromptmatrix.in',
]);

function getResizeOrigin() {
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
  const trimmed = url.trim();
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
    width: options.width ?? 720,
    quality: options.quality ?? 74,
    fit: options.fit ?? 'scale-down',
  });
}

export function getPromptImageUrl(url?: string, options: ThumbnailOptions = {}) {
  return getCloudflareImageUrl(url, {
    width: options.width ?? 1200,
    quality: options.quality ?? 78,
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
