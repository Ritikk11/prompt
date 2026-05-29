'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import Image, { type ImageProps } from 'next/image';

type LoadingImageProps = ImageProps & {
  showSkeleton?: boolean;
  skeleton?: boolean;
  wrapperClassName?: string;
};

export default function LoadingImage({
  showSkeleton = false,
  skeleton,
  wrapperClassName = '',
  className = '',
  alt,
  onLoad,
  ...props
}: LoadingImageProps) {
  const [loaded, setLoaded] = useState(false);
  const enabled = skeleton ?? showSkeleton;
  const image = (
    <Image
      {...props}
      alt={alt}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      className={`${className} ${enabled ? `transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}` : ''}`}
    />
  );

  const shimmer = enabled && !loaded ? (
    <span className="pointer-events-none absolute inset-0 z-[1] image-shimmer" aria-hidden="true" />
  ) : null;

  if (props.fill) {
    return (
      <>
        {shimmer}
        {image}
      </>
    );
  }

  return (
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {shimmer}
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
  ...props
}: LoadingImgProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {showSkeleton && !loaded ? (
        <span className="pointer-events-none absolute inset-0 z-[1] image-shimmer" aria-hidden="true" />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        alt={alt}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        className={`${className} ${showSkeleton ? `transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}` : ''}`}
      />
    </span>
  );
}
