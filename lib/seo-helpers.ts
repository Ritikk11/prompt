import { Metadata } from 'next';
import { SiteSettings } from '@/lib/types';

export function generateSeoPageMetadata(seoPage: any, settings: SiteSettings): Metadata {
  const seoSettings = settings.seoSettings;
  return {
    title: seoPage.seoTitle || seoPage.title,
    description: seoPage.seoDescription || seoSettings?.defaultMetaDescription || `Discover best prompts for ${seoPage.title}`,
    openGraph: seoSettings?.defaultOgImage ? {
      title: seoPage.seoTitle || seoPage.title,
      description: seoPage.seoDescription || seoSettings?.defaultMetaDescription || `Discover best prompts for ${seoPage.title}`,
      images: [{ url: seoSettings.defaultOgImage }],
    } : undefined,
  };
}
