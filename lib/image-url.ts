type ThumbnailOptions = {
  width?: number;
  quality?: string;
};

function transformCloudinaryUrl(url: string, options: ThumbnailOptions) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const [, afterUpload = ''] = url.split('/image/upload/');
  const firstSegment = afterUpload.split('/')[0] || '';
  if (firstSegment.includes(',') || /^(c|e|f|g|h|q|r|w|x|y)_/.test(firstSegment)) {
    return url;
  }

  const transform = `f_auto,q_${options.quality || 'auto:eco'},c_limit,w_${options.width || 720}`;
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}

export function getThumbnailImageUrl(url?: string, options: ThumbnailOptions = {}) {
  if (!url || url.startsWith('data:image')) return url || '';
  return transformCloudinaryUrl(url, options);
}
