type ThumbnailOptions = {
  width?: number;
  quality?: string;
};

export function getThumbnailImageUrl(url?: string, _options: ThumbnailOptions = {}) {
  if (!url || url.startsWith('data:image')) return url || '';
  return url;
}
