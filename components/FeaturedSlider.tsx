'use client';
import dynamic from 'next/dynamic';
import type { HeroProps } from '@/components/hero/sliderShared';

// Each hero style lives in its own chunk so visitors only download the one
// variant the site actually uses (settings.heroStyle), not all nine.
const heroVariants = {
  v1: dynamic(() => import('@/components/hero/HeroV1')),
  v2: dynamic(() => import('@/components/hero/HeroV2')),
  v3: dynamic(() => import('@/components/hero/HeroV3')),
  v4: dynamic(() => import('@/components/hero/HeroV4')),
  v5: dynamic(() => import('@/components/hero/HeroV5')),
  v6: dynamic(() => import('@/components/hero/HeroV6')),
  v7: dynamic(() => import('@/components/hero/HeroV7')),
  v8: dynamic(() => import('@/components/hero/HeroV8')),
  v9: dynamic(() => import('@/components/hero/HeroV9')),
} as const;

export default function FeaturedSlider(props: HeroProps) {
  const { featuredPosts, settings } = props;
  if (!settings.heroEnabled) return null;
  if (featuredPosts.length === 0) return null;

  const heroStyle = (settings.heroStyle || 'v1') as keyof typeof heroVariants;
  const Hero = heroVariants[heroStyle] || heroVariants.v1;
  return <Hero {...props} />;
}
