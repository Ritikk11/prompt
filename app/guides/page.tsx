export const revalidate = 2592000;

import type { Metadata } from 'next';
import Link from '@/components/PrefetchLink';
import { ArrowRight } from 'lucide-react';
import { getArticlesForSettings } from '@/lib/content';
import { fetchSettings } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import ScrollReveal from '@/components/ScrollReveal';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const siteTitle = settings.siteTitle || 'PromptSoul';

  const rawTitle = (discovery.guidesSeoTitle || 'AI Prompt Guides & Tutorials')
    .replace(/\s*(?:\||-|–|—)\s*(?:%site_title%|PromptSoul|AI PromptMatrix)$/i, '')
    .trim();
  const description = discovery.guidesSeoDescription || 'Step-by-step AI image tutorials — trending photo styles, Gemini and ChatGPT walkthroughs, photo restoration, headshots, and more.';
  const ogImage = discovery.guidesOgImage || settings.seoSettings?.defaultOgImage;

  return {
    title: rawTitle,
    description,
    alternates: { canonical: '/guides' },
    openGraph: {
      title: `${rawTitle} | ${siteTitle}`,
      description,
      siteName: siteTitle,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in'}/guides`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function GuidesPage() {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const guides = getArticlesForSettings(settings, 'guide');

  const badge = discovery.guidesBadge || 'Guides';
  const heading = discovery.guidesTitle || 'AI Prompt Guides';
  const subtitle = discovery.guidesDescription || 'Follow-along tutorials that take you from a blank prompt box to a finished image — viral trends, photo edits, and professional results included.';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">{badge}</p>
      <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">{heading}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
        {subtitle}
      </p>

      <ScrollReveal>
        <div data-reveal-stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(guide => (
            <ArticleCard key={guide.slug} article={guide} />
          ))}
        </div>
      </ScrollReveal>

      <Link href="/explore" prefetch={true} className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-600">
        Browse prompts <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
