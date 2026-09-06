import { MessageSquareText, Star } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import ScrollReveal from '@/components/ScrollReveal';
import SectionHeader from '@/components/SectionHeader';

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
  const items = content.items?.length ? content.items : feedback;
  return (
    <section className="relative w-full overflow-clip px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal slide>
          <SectionHeader
            icon={<MessageSquareText className="h-4 w-4" />}
            badge={content.badge || 'Creator-focused'}
            title={content.title || 'Built for Creators Who Need Usable Prompts'}
            accentWord="Usable Prompts"
            description={content.description || 'Built for creators who want practical prompt examples, clear model notes, and repeatable workflows instead of vague inspiration screenshots.'}
          />
        </ScrollReveal>

        <ScrollReveal stagger className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {items.map(item => (
            <div key={item.title} className="glass-card p-6 transition hover:border-primary-400/60 dark:hover:border-primary-400/50">
              <div className="mb-4 flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
              </div>
              <h3 className="font-extrabold text-surface-950 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">{item.text}</p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
