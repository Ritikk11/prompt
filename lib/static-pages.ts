import type { Metadata } from 'next';
import type { SiteSettings, StaticPageSettings } from './types';

export type StaticPageKey = 'about' | 'contact' | 'privacy' | 'terms' | 'dmca' | 'disclaimer';

const defaults: Record<StaticPageKey, Pick<StaticPageSettings, 'title' | 'subtitle' | 'metaTitle' | 'metaDescription'>> = {
  about: {
    title: 'About Us',
    subtitle: 'Discover our mission, our story, and what makes this platform the ultimate destination for AI creators.',
    metaTitle: 'About Us | AI PromptMatrix',
    metaDescription: 'Learn about AI PromptMatrix and our mission to curate useful AI prompts.',
  },
  contact: {
    title: 'Contact Us',
    subtitle: "Have a question or want to work together? We'd love to hear from you.",
    metaTitle: 'Contact Us | AI PromptMatrix',
    metaDescription: 'Contact AI PromptMatrix for support, partnerships, and media inquiries.',
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Learn how we collect, use, and protect your personal information.',
    metaTitle: 'Privacy Policy | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix privacy policy.',
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'The rules and terms that apply when using this website.',
    metaTitle: 'Terms of Service | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix terms of service.',
  },
  dmca: {
    title: 'DMCA Notice',
    subtitle: 'Information regarding copyright infringement claims.',
    metaTitle: 'DMCA Notice | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix DMCA notice.',
  },
  disclaimer: {
    title: 'Disclaimer',
    subtitle: 'Important limitations and usage notes for this website.',
    metaTitle: 'Disclaimer | AI PromptMatrix',
    metaDescription: 'Read the AI PromptMatrix disclaimer.',
  },
};

export function getStaticPageContent(
  settings: SiteSettings,
  key: StaticPageKey,
  legacyBody: string | undefined,
  fallbackBody: string
) {
  const page = settings.staticPages?.[key] || {};
  const fallback = defaults[key];
  return {
    title: page.title || fallback.title || '',
    subtitle: page.subtitle || fallback.subtitle || '',
    body: page.body || legacyBody || fallbackBody,
    metaTitle: page.metaTitle || fallback.metaTitle || page.title || fallback.title || '',
    metaDescription: page.metaDescription || fallback.metaDescription || page.subtitle || fallback.subtitle || '',
    ogImage: page.ogImage || settings.seoSettings?.defaultOgImage || '',
    visible: page.visible !== false,
  };
}

export function staticPageMetadata(page: ReturnType<typeof getStaticPageContent>): Metadata {
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: page.ogImage ? {
      title: page.metaTitle,
      description: page.metaDescription,
      images: [{ url: page.ogImage }],
    } : undefined,
  };
}
