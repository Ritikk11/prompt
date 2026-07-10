export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getArticlesForSettings } from '@/lib/content';
import { fetchSettings } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'AI Prompt Guides & Tutorials | AI PromptMatrix',
  description: 'Step-by-step AI image tutorials — trending photo styles, Gemini and ChatGPT walkthroughs, photo restoration, headshots, and more.',
  alternates: { canonical: '/guides' },
};

export default async function GuidesPage() {
  const settings = await fetchSettings();
  const guides = getArticlesForSettings(settings, 'guide');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Guides</p>
      <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">AI Prompt Guides</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
        Follow-along tutorials that take you from a blank prompt box to a finished image — viral trends, photo edits, and professional results included.
      </p>

      <ScrollReveal>
        <div data-reveal-stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(guide => (
            <ArticleCard key={guide.slug} article={guide} />
          ))}
        </div>
      </ScrollReveal>

      <Link href="/explore" className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-600">
        Browse prompts <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
