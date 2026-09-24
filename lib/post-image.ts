import { getPromptImageUrl, getThumbnailSrcSet } from './image-url';

// Keep the preload and the rendered hero on exactly the same candidate URLs.
// These slots match PostContent's 280 / 340 / 440px artwork containers.
export function getPostHeroImageProps(url?: string) {
  return {
    src: getPromptImageUrl(url, { width: 560, quality: 74 }),
    srcSet: getThumbnailSrcSet(url, [280, 360, 440, 560, 680, 880, 1120, 1320], 74),
    sizes: '(max-width: 639px) 280px, (max-width: 1023px) 340px, 440px',
  };
}
