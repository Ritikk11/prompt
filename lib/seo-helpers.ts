import { Metadata } from 'next';
import { SiteSettings } from '@/lib/types';

/**
 * Automatically formats metadata titles:
 * Appends "| SiteTitle" to every page title if it is not already present,
 * avoiding duplicate site titles like "Title | AI PromptMatrix | AI PromptMatrix".
 */
export function formatTitleWithBrand(title?: string | null, siteTitle: string = 'AI PromptMatrix'): string {
  const brand = (siteTitle || 'AI PromptMatrix').trim();
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

export function generateSeoPageMetadata(seoPage: any, settings: SiteSettings): Metadata {
  const siteTitle = settings.siteTitle || 'AI PromptMatrix';
  const rawTitle = seoPage.seoTitle || seoPage.title;
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const description = seoPage.seoDescription || settings.seoSettings?.defaultMetaDescription || `Discover best prompts for ${seoPage.title}`;
  const canonicalUrl = seoPage.slug ? `${siteUrl}/${seoPage.slug}` : undefined;

  return {
    title: { absolute: title },
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'website',
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(settings.seoSettings?.defaultOgImage ? { images: [{ url: settings.seoSettings.defaultOgImage }] } : {}),
    },
  };
}
