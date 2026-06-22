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
    <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-surface-100 text-center text-surface-500 dark:bg-surface-900 dark:text-surface-400">
      <span className={compact ? 'px-3 text-xs font-medium' : 'px-4 text-sm font-medium'}>
        Image is taking longer than usual
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
  const enabled = skeleton ?? showSkeleton;
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
  const fallback = enabled && failed && !loaded ? <ImageFallback /> : null;

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
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {shimmer}
      {fallback}
      {image}
    </span>
  );
}

type LoadingImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  showSkeleton?: boolean;
  wrapperClassName?: string;
};

export function LoadingImg({
  showSkeleton = false,
  wrapperClassName = '',
  className = '',
  alt = '',
  onLoad,
  onError,
  ...props
}: LoadingImgProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
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
    if (!showSkeleton) return;
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
  }, [srcValue, showSkeleton]);

  const settled = loaded || failed || timedOut;

  return (
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {showSkeleton && !settled ? (
        <span className="pointer-events-none absolute inset-0 z-[1] image-shimmer" aria-hidden="true" />
      ) : null}
      {showSkeleton && failed && !loaded ? <ImageFallback compact /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        ref={imageRef}
        alt={alt}
        loading={props.loading ?? 'lazy'}
        decoding={props.decoding ?? 'async'}
        onLoad={(event) => {
          setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
          onLoad?.(event);
        }}
        onError={(event) => {
          setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
          onError?.(event);
        }}
        className={`${className} ${showSkeleton ? `transition-opacity duration-300 ${settled ? 'opacity-100' : 'opacity-0'}` : ''} ${failed ? 'invisible' : ''}`}
      />
    </span>
  );
}
