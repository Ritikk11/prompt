'use client';

import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import Image, { type ImageProps } from 'next/image';

const IMAGE_WAIT_TIMEOUT_MS = 12000;

type ImageLoadState = {
  src: ImageProps['src'] | ImgHTMLAttributes<HTMLImageElement>['src'];
  loaded: boolean;
  failed: boolean;
  timedOut: boolean;
};

type LoadingImageProps = ImageProps & {
  showSkeleton?: boolean;
  skeleton?: boolean;
  wrapperClassName?: string;
};

function ImageFallback({ compact = false }: { compact?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-surface-100 text-center text-surface-400 dark:bg-surface-900 dark:text-surface-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={compact ? 'h-6 w-6' : 'h-8 w-8'} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span className={compact ? 'px-3 text-xs font-medium' : 'px-4 text-sm font-medium'}>
        Image unavailable
      </span>
    </span>
  );
}

export default function LoadingImage({
  showSkeleton = false,
  skeleton,
  wrapperClassName = '',
  className = '',
  alt,
  onLoad,
  onError,
  ...props
}: LoadingImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  // Priority images are LCP candidates — never gate them behind the skeleton's
  // opacity-0, or the browser can't paint them until hydration + onLoad, which
  // adds seconds of LCP render delay on mobile.
  const enabled = (skeleton ?? showSkeleton) && !props.priority;
  const srcValue = props.src;
  const [imageState, setImageState] = useState<ImageLoadState>({
    src: srcValue,
    loaded: false,
    failed: false,
    timedOut: false,
  });
  const isCurrentSrc = imageState.src === srcValue;
  const loaded = isCurrentSrc && imageState.loaded;
  const failed = isCurrentSrc && imageState.failed;
  const timedOut = isCurrentSrc && imageState.timedOut;

  useEffect(() => {
    // One-shot check for every image: failures that fired before hydration
    // never reach onError, leaving the broken img collapsed with no fallback.
    const initial = imageRef.current;
    if (initial?.complete && initial.naturalWidth === 0) {
      setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
      return;
    }
    if (!enabled) return;
    let completeCheck = 0;
    let interval: number | undefined;
    let timer: number | undefined;
    const stopWatching = () => {
      if (completeCheck) window.cancelAnimationFrame(completeCheck);
      if (interval) window.clearInterval(interval);
      if (timer) window.clearTimeout(timer);
    };
    const markIfLoaded = () => {
      const image = imageRef.current;
      if (!image?.complete) return false;
      if (image.naturalWidth > 0) {
        setImageState(prev => (
          prev.src === srcValue && prev.loaded && !prev.failed && !prev.timedOut
            ? prev
            : { src: srcValue, loaded: true, failed: false, timedOut: false }
        ));
        stopWatching();
        return true;
      } else {
        setImageState(prev => (
          prev.src === srcValue && prev.failed
            ? prev
            : { src: srcValue, loaded: false, failed: true, timedOut: false }
        ));
        stopWatching();
        return true;
      }
    };
    completeCheck = window.requestAnimationFrame(markIfLoaded);
    interval = window.setInterval(markIfLoaded, 500);
    timer = window.setTimeout(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
        stopWatching();
        return;
      }
      setImageState(prev => (
        prev.src === srcValue && prev.loaded
          ? prev
          : { src: srcValue, loaded: false, failed: false, timedOut: true }
      ));
      stopWatching();
    }, IMAGE_WAIT_TIMEOUT_MS);
    return stopWatching;
  }, [enabled, srcValue]);

  const settled = loaded || failed || timedOut;
  const image = (
    <Image
      {...props}
      ref={imageRef}
      alt={alt}
      onLoad={(event) => {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
        onLoad?.(event);
      }}
      onError={(event) => {
        setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
        onError?.(event);
      }}
      className={`${className} ${enabled ? `transition-opacity duration-300 ${settled ? 'opacity-100' : 'opacity-0'}` : ''} ${failed ? 'invisible' : ''}`}
    />
  );

  const shimmer = enabled && !settled ? (
    <span className="pointer-events-none absolute inset-0 z-[1] image-shimmer" aria-hidden="true" />
  ) : null;
  const fallback = failed && !loaded ? <ImageFallback /> : null;

  if (props.fill) {
    return (
      <>
        {shimmer}
        {fallback}
        {image}
      </>
    );
  }

  return (
    <span className={`relative block overflow-hidden${failed ? ' flex min-h-[220px] sm:min-h-[320px] items-center justify-center' : ''} ${wrapperClassName}`}>
      {shimmer}
      {fallback}
      {image}
    </span>
  );
}

type LoadingImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  showSkeleton?: boolean;
  wrapperClassName?: string;
  // LCP candidates: loads eagerly with fetchpriority=high and skips the
  // skeleton's opacity-0 gating (same rationale as LoadingImage's priority —
  // hiding the image until hydration + onLoad adds seconds of LCP render delay).
  priority?: boolean;
};

export function LoadingImg({
  showSkeleton = false,
  wrapperClassName = '',
  className = '',
  alt = '',
  priority = false,
  onLoad,
  onError,
  ...props
}: LoadingImgProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const enabled = showSkeleton && !priority;
  const srcValue = props.src;
  const [imageState, setImageState] = useState<ImageLoadState>({
    src: srcValue,
    loaded: false,
    failed: false,
    timedOut: false,
  });
  const isCurrentSrc = imageState.src === srcValue;
  const loaded = isCurrentSrc && imageState.loaded;
  const failed = isCurrentSrc && imageState.failed;
  const timedOut = isCurrentSrc && imageState.timedOut;

  useEffect(() => {
    // One-shot: failures that fired before hydration never reach onError.
    const initial = imageRef.current;
    if (initial?.complete && initial.naturalWidth === 0) {
      setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
      return;
    }
    if (!enabled) return;
    let completeCheck = 0;
    let interval: number | undefined;
    let timer: number | undefined;
    const stopWatching = () => {
      if (completeCheck) window.cancelAnimationFrame(completeCheck);
      if (interval) window.clearInterval(interval);
      if (timer) window.clearTimeout(timer);
    };
    const markIfLoaded = () => {
      const image = imageRef.current;
      if (!image?.complete) return false;
      if (image.naturalWidth > 0) {
        setImageState(prev => (
          prev.src === srcValue && prev.loaded && !prev.failed && !prev.timedOut
            ? prev
            : { src: srcValue, loaded: true, failed: false, timedOut: false }
        ));
        stopWatching();
        return true;
      } else {
        setImageState(prev => (
          prev.src === srcValue && prev.failed
            ? prev
            : { src: srcValue, loaded: false, failed: true, timedOut: false }
        ));
        stopWatching();
        return true;
      }
    };
    completeCheck = window.requestAnimationFrame(markIfLoaded);
    interval = window.setInterval(markIfLoaded, 500);
    timer = window.setTimeout(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
        stopWatching();
        return;
      }
      setImageState(prev => (
        prev.src === srcValue && prev.loaded
          ? prev
          : { src: srcValue, loaded: false, failed: false, timedOut: true }
      ));
      stopWatching();
    }, IMAGE_WAIT_TIMEOUT_MS);
    return stopWatching;
  }, [srcValue, enabled]);

  const settled = loaded || failed || timedOut;
  // On failure the image contributes no height (broken img has no natural
  // dimensions), which collapses the wrapper to a sliver and squashes the
  // fallback. Reserve real space so the placeholder stays readable.
  const failedSizing = failed ? ' flex min-h-[220px] sm:min-h-[320px] items-center justify-center' : '';

  return (
    <span className={`relative block overflow-hidden${failedSizing} ${wrapperClassName}`}>
      {(enabled || failed) && !settled ? (
        <span className="pointer-events-none absolute inset-0 z-[1] image-shimmer" aria-hidden="true" />
      ) : null}
      {failed && !loaded ? <ImageFallback compact /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        ref={imageRef}
        alt={alt}
        loading={props.loading ?? (priority ? 'eager' : 'lazy')}
        fetchPriority={props.fetchPriority ?? (priority ? 'high' : undefined)}
        decoding={props.decoding ?? 'async'}
        onLoad={(event) => {
          setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
          onLoad?.(event);
        }}
        onError={(event) => {
          setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
          onError?.(event);
        }}
        className={`${className} ${enabled ? `transition-opacity duration-300 ${settled ? 'opacity-100' : 'opacity-0'}` : ''} ${failed ? 'sr-only h-0 w-0' : ''}`}
      />
    </span>
  );
}
