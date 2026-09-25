import { getPromptImageUrl, getThumbnailSrcSet } from './image-url';

// Keep the preload and the rendered hero on exactly the same candidate URLs.
// These slots match PostContent's 280 / 340 / 440px artwork containers.
// q68 (down from 74): on WebP at these sizes the difference is imperceptible
// but it trims ~15% off the LCP fetch on throttled mobile.
export function getPostHeroImageProps(url?: string) {
  return {
    src: getPromptImageUrl(url, { width: 560, quality: 68 }),
    srcSet: getThumbnailSrcSet(url, [280, 360, 440, 560, 680, 880, 1120, 1320], 68),
    sizes: '(max-width: 639px) 280px, (max-width: 1023px) 340px, 440px',
  };
}
