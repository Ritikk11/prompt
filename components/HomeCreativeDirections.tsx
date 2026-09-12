import Link from 'next/link';
import { Grid3X3 } from 'lucide-react';
import type { CreativeDirectionItem, Post, SiteSettings } from '@/lib/types';
import ScrollReveal from '@/components/ScrollReveal';
import SectionHeader from '@/components/SectionHeader';

function titleCase(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function countMatches(posts: Post[], item: CreativeDirectionItem) {
  const target = item.value.toLowerCase();
  return posts.filter(post => {
    if (item.type === 'tool') {
      return [...(post.aiTools || []), ...post.images.flatMap(image => image.aiTools || [image.aiTool].filter(Boolean))]
        .some(value => value.toLowerCase() === target);
    }
    if (item.type === 'category') {
      return [post.category, ...(post.categories || [])].filter(Boolean).some(value => value!.toLowerCase() === target);
    }
    return (post.tags || []).some(value => value.toLowerCase() === target);
  }).length;
}

function itemHref(item: CreativeDirectionItem) {
  if (item.type === 'tool') return `/tool/${encodeURIComponent(item.value)}`;
  if (item.type === 'category') return `/explore?category=${encodeURIComponent(item.value)}`;
  return `/tag/${encodeURIComponent(item.value.toLowerCase())}`;
}

export default function HomeCreativeDirections({ posts, settings }: { posts: Post[]; settings?: SiteSettings }) {
  const content = settings?.homepageContent?.creativeDirections || {};
  const counts = new Map<string, number>();
  posts.forEach(post => {
    const values = [...(post.categories || []), post.category, ...(post.tags || [])].filter(Boolean) as string[];
    values.slice(0, 4).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  });

  const customDirections = settings?.creativeDirectionItems?.filter(item => item.label && item.value) || [];
  const directions = customDirections.length > 0
    ? customDirections.slice(0, 8).map(item => [item, countMatches(posts, item)] as const)
    : Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => [{ label: titleCase(name), value: name, type: 'tag' } as CreativeDirectionItem, count] as const);

  if (directions.length === 0) return null;

  return (
    <section className="relative w-full overflow-clip px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal slide>
          <SectionHeader
            icon={<Grid3X3 className="h-4 w-4" />}
            badge={content.badge || 'Browse by style'}
            title={content.title || 'Explore Creative Directions'}
            accentWord="Creative Directions"
            description={content.description || 'Browse by subject, genre, and visual direction — from portraits and posters to product shots and anime styles.'}
          />
        </ScrollReveal>

        <ScrollReveal stagger className="flex flex-wrap items-center justify-center gap-3">
          {directions.map(([item, count]) => (
            <Link
              key={`${item.type}-${item.value}`}
              href={itemHref(item)}
              /* /test design: compact glass pills, not the old icon cards.
                 Glass pills (backdrop-blur-xl ≙ capped 12px) over flat cards:
                 no nested blur passes, hover scales the pill itself. */
              className="group inline-flex items-center gap-2.5 rounded-full border border-white/60 bg-white/25 px-5 py-2.5 text-sm font-bold text-surface-700 shadow-sm backdrop-blur-md backdrop-saturate-150 transition-all duration-200 hover:scale-105 hover:border-primary-400 hover:bg-white/60 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/[0.10] dark:hover:text-white"
            >
              {item.label}
              {!content.hidePromptCounts && (
                <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[11px] font-black text-primary-600 dark:bg-primary-400/15 dark:text-primary-300">
                  {count}
                </span>
              )}
            </Link>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
