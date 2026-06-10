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
    const completeCheck = window.requestAnimationFrame(() => {
      const image = imageRef.current;
      if (!image?.complete) return;
      if (image.naturalWidth > 0) {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
      } else {
        setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
      }
    });
    const timer = window.setTimeout(() => {
      setImageState(prev => (
        prev.src === srcValue && prev.loaded
          ? prev
          : { src: srcValue, loaded: false, failed: false, timedOut: true }
      ));
    }, IMAGE_WAIT_TIMEOUT_MS);
    return () => {
      window.cancelAnimationFrame(completeCheck);
      window.clearTimeout(timer);
    };
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
  const fallback = enabled && (failed || timedOut) && !loaded ? <ImageFallback /> : null;

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
    const completeCheck = window.requestAnimationFrame(() => {
      const image = imageRef.current;
      if (!image?.complete) return;
      if (image.naturalWidth > 0) {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
      } else {
        setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
      }
    });
    const timer = window.setTimeout(() => {
      setImageState(prev => (
        prev.src === srcValue && prev.loaded
          ? prev
          : { src: srcValue, loaded: false, failed: false, timedOut: true }
      ));
    }, IMAGE_WAIT_TIMEOUT_MS);
    return () => {
      window.cancelAnimationFrame(completeCheck);
      window.clearTimeout(timer);
    };
  }, [srcValue, showSkeleton]);

  const settled = loaded || failed || timedOut;

  return (
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {showSkeleton && !settled ? (
        <span className="pointer-events-none absolute inset-0 z-[1] image-shimmer" aria-hidden="true" />
      ) : null}
      {showSkeleton && (failed || timedOut) && !loaded ? <ImageFallback compact /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
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
        className={`${className} ${showSkeleton ? `transition-opacity duration-300 ${settled ? 'opacity-100' : 'opacity-0'}` : ''} ${failed ? 'invisible' : ''}`}
      />
    </span>
  );
}
