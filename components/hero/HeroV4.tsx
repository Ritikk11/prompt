'use client';
import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/types';
import LoadingImage from '@/components/LoadingImage';
import { promptImageUrl, type HeroProps } from './sliderShared';

// V4: Grid / Bento (Doesn't use auto-play slider, but shows top 3-4 featured)
export default function HeroV4({ featuredPosts: featured, settings }: HeroProps) {
  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const topFeatured = featured.slice(0, 3);
  if (topFeatured.length === 0) return null;
  return (
    <div className="relative w-full rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Main Large Item */}
        <Link href={`/${topFeatured[0].slug || topFeatured[0].id}`} className="relative h-[400px] lg:h-[500px] lg:col-span-2 rounded-2xl overflow-hidden group">
          <Image src={promptImageUrl(topFeatured[0])} alt={`bg-${topFeatured[0].title}`} fill sizes="20vw" className="object-cover blur-2xl scale-125 opacity-40 dark:opacity-30"  referrerPolicy="no-referrer" />
          <LoadingImage src={promptImageUrl(topFeatured[0])} alt="" fill priority sizes="(max-width: 1024px) 100vw, 66vw" showSkeleton={showSkeleton} className="object-contain transition-transform duration-700 group-hover:scale-105"  referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <span className="px-3 py-1 w-max rounded-full text-xs font-bold bg-primary-500 text-white mb-3 shadow-lg">⭐ Main Feature</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{topFeatured[0].title}</h2>
            <p className="text-white/80 line-clamp-2 max-w-lg">{topFeatured[0].description}</p>
          </div>
        </Link>
        {/* Side Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {topFeatured.slice(1).map((fPost) => (
            <Link key={fPost.id} href={`/${fPost.slug || fPost.id}`} className="relative h-[200px] sm:h-[250px] lg:h-[calc(250px-4px)] rounded-2xl overflow-hidden group">
              <Image src={promptImageUrl(fPost)} alt={`bg-${fPost.title}`} fill sizes="20vw" className="object-cover blur-xl scale-125 opacity-40 dark:opacity-30"  referrerPolicy="no-referrer" />
              <LoadingImage src={promptImageUrl(fPost)} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" showSkeleton={showSkeleton} className="object-contain transition-transform duration-700 group-hover:scale-105"  referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h3 className="text-xl font-bold text-white mb-1 leading-tight">{fPost.title}</h3>
                <p className="text-white/80 text-sm line-clamp-1">{fPost.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
