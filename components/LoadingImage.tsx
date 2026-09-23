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
  // Fade/scale in on load for every non-priority image (independent of the
  // skeleton setting) so images don't pop in abruptly. Priority/LCP images are
  // never gated, keeping first paint instant.
  const reveal = !props.priority;
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
    // One-shot check for every image: if the image already finished loading
    // (from browser HTTP cache or before hydration), update state immediately
    // rather than staying hidden behind opacity-0 for extra frames.
    const initial = imageRef.current;
    if (initial?.complete) {
      if (initial.naturalWidth > 0) {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
        return;
      } else {
        setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
        return;
      }
    }
    if (!reveal) return;
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
  }, [enabled, reveal, srcValue]);

  const settled = loaded || failed || timedOut;
  const hasTransition = /\btransition\b|\btransition-/.test(className);
  const transitionClass = reveal
    ? `${hasTransition ? '' : 'transition-[opacity,transform,filter] duration-500 ease-out '}${settled ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-[8px] scale-[1.01]'}`
    : '';
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
      className={`${className} ${transitionClass} ${failed ? 'invisible' : ''}`.trim()}
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
    <span className={`relative block overflow-hidden${failed ? ' flex aspect-[4/5] max-h-[85vh] w-full items-center justify-center' : ''} ${wrapperClassName}`}>
      {shimmer}
      {fallback}
      {image}
    </span>
  );
}

type LoadingImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  showSkeleton?: boolean;
  wrapperClassName?: string;
  // When provided (real width/height known), the wrapper reserves this exact
  // ratio so the shimmer box matches the final image shape — zero layout shift,
  // and the image fills it (no crop, since the ratio is the image's own).
  aspectRatio?: number;
  // LCP candidates: loads eagerly with fetchpriority=high and skips the
  // skeleton's opacity-0 gating (same rationale as LoadingImage's priority —
  // hiding the image until hydration + onLoad adds seconds of LCP render delay).
  priority?: boolean;
};

export function LoadingImg({
  showSkeleton = false,
  wrapperClassName = '',
  aspectRatio,
  className = '',
  alt = '',
  priority = false,
  onLoad,
  onError,
  ...props
}: LoadingImgProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const enabled = showSkeleton && !priority;
  // Fade/scale the image in on load for every non-priority image, regardless of
  // the skeleton setting — otherwise images "pop" in abruptly. Priority (LCP)
  // images are never gated, so first paint stays instant.
  const reveal = !priority;
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
    // One-shot: if the image already finished loading (from HTTP cache or
    // before hydration), update state immediately so it is not hidden behind
    // opacity-0 for extra frames.
    const initial = imageRef.current;
    if (initial?.complete) {
      if (initial.naturalWidth > 0) {
        setImageState({ src: srcValue, loaded: true, failed: false, timedOut: false });
        return;
      } else {
        setImageState({ src: srcValue, loaded: false, failed: true, timedOut: false });
        return;
      }
    }
    if (!reveal) return;
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
  }, [srcValue, reveal]);

  const settled = loaded || failed || timedOut;
  const hasTransition = /\btransition\b|\btransition-/.test(className);
  const transitionClass = reveal
    ? `${hasTransition ? '' : 'transition-[opacity,transform,filter] duration-500 ease-out '}${settled ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-[8px] scale-[1.01]'}`
    : '';
  // While loading or on failure, an unrendered/broken image contributes no
  // intrinsic height, which collapses the wrapper to a thin sliver and squashes
  // the shimmer/fallback. Reserve real space until settled so the skeleton
  // presents a full card preview and the browser can measure layout accurately.
  const hasExplicitSizing = /\b(aspect-|h-|max-h-)\b/.test(wrapperClassName) || !!aspectRatio;
  const placeholderSizing =
    (!settled || failed) && !hasExplicitSizing
      ? ' flex aspect-[4/5] sm:aspect-square max-h-[85vh] min-h-[280px] w-full items-center justify-center'
      : (failed ? ' flex aspect-[4/5] max-h-[85vh] w-full items-center justify-center' : '');
  // With a reserved ratio, the image fills the box (cover == contain here since
  // the ratio is the image's own, so nothing is cropped). Otherwise keep the
  // caller-provided classes (legacy natural-height flow).
  const imgClassName = aspectRatio
    ? `absolute inset-0 h-full w-full object-cover ${className}`
    : className;

  return (
    <span
      className={`relative block overflow-hidden${placeholderSizing} ${wrapperClassName}`}
      style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
    >
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
        className={`${imgClassName} ${transitionClass} ${failed ? 'sr-only h-0 w-0' : ''}`.trim()}
      />
    </span>
  );
}
