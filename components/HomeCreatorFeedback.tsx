import { MessageSquareText, Star } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';

const feedback = [
  {
    title: 'Faster prompt browsing',
    text: 'Visitors can move through image prompt ideas by tool, style, and intent instead of guessing which post is useful.',
  },
  {
    title: 'Clear model context',
    text: 'Prompt pages show the AI tool and model labels, so creators know where each prompt is meant to be used.',
  },
  {
    title: 'Reusable collections',
    text: 'Multi-prompt posts, copy actions, and workflow notes make prompts easier to test and revisit later.',
  },
  {
    title: 'Better organized library',
    text: 'Sections, tags, search, and custom pages help the site feel like a curated resource instead of a raw feed.',
  },
];

export default function HomeCreatorFeedback({ settings }: { settings?: SiteSettings }) {
  const content = settings?.homepageContent?.creatorFeedback || {};
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-white px-5 py-16 dark:bg-surface-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-4 py-2 text-xs font-bold text-pink-600 dark:text-pink-300">
          <MessageSquareText className="h-4 w-4" />
          {content.badge || 'Creator-focused'}
        </div>
        <h2 className="text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white">{content.title || 'Built for Creators Who Need Usable Prompts'}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
          {content.description || 'These blocks explain why the library is useful without relying on fake testimonials.'}
        </p>
      </div>

      <div className="mx-auto mt-9 grid max-w-5xl gap-5 md:grid-cols-2">
        {feedback.map(item => (
          <div key={item.title} className="rounded-2xl border border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900/70">
            <div className="mb-4 flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
            </div>
            <h3 className="font-extrabold text-surface-950 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">{item.text}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
