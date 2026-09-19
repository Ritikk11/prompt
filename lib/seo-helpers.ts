import { Metadata } from 'next';
import { SiteSettings } from '@/lib/types';

/**
 * Automatically formats metadata titles:
 * Appends "| SiteTitle" to every page title if it is not already present,
 * avoiding duplicate site titles like "Title | AI PromptMatrix | AI PromptMatrix".
 */
export function formatTitleWithBrand(title?: string | null, siteTitle: string = 'PromptSoul'): string {
  const brand = (siteTitle || 'PromptSoul').trim();
  if (!title || !title.trim()) return brand;
  
  let cleanedTitle = title.trim();
  cleanedTitle = cleanedTitle.replace(/%site_title%/g, brand);

  if (cleanedTitle.toLowerCase() === brand.toLowerCase()) {
    return brand;
  }

  const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match " | Brand" or " - Brand" or " – Brand" at end of string safely
  const endBrandRegex = new RegExp(`(?:\\s*(?:\\||-|–|—)\\s*${escapedBrand})$`, 'i');

  if (endBrandRegex.test(cleanedTitle)) {
    cleanedTitle = cleanedTitle.replace(endBrandRegex, '').trim();
  }

  // Also check if title ends with siteTitle without separator
  const rawEndRegex = new RegExp(`\\s*${escapedBrand}$`, 'i');
  if (rawEndRegex.test(cleanedTitle)) {
    cleanedTitle = cleanedTitle.replace(rawEndRegex, '').trim();
  }

  if (!cleanedTitle) return brand;

  return `${cleanedTitle} | ${brand}`;
}

export function generateSeoPageMetadata(seoPage: any, settings: SiteSettings, matchingPosts?: any[]): Metadata {
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const rawTitle = seoPage.seoTitle || seoPage.heroTitle || seoPage.title;
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in').replace(/\/$/, '');
  const description = seoPage.seoDescription || seoPage.heroDescription || settings.seoSettings?.defaultMetaDescription || `Discover curated AI prompts for ${seoPage.title}`;

  const cleanSlug = String(seoPage.slug || '').replace(/^\/+|\/+$/g, '');
  const canonicalUrl = cleanSlug ? `${siteUrl}/${cleanSlug}` : undefined;

  // Resolve best high-resolution image for social preview
  const firstPromptImage = matchingPosts?.[0]?.images?.[0]?.url || matchingPosts?.[0]?.thumbnailUrl;
  const ogImage = firstPromptImage || settings.seoSettings?.defaultOgImage || `${siteUrl}/og-image.webp`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      ...(seoPage.tags || []),
      ...(seoPage.categories || []),
      ...(seoPage.aiTools || []),
      'AI prompts',
      'chatgpt prompts',
      'gemini prompts',
    ],
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: settings.seoSettings?.twitterHandle || undefined,
      images: ogImage ? [ogImage] : [],
    },
  };
}
