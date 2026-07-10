import Link from 'next/link';
import { Grid3X3 } from 'lucide-react';
import type { CreativeDirectionItem, Post, SiteSettings } from '@/lib/types';
import { articleIconMap, articleIconList } from '@/components/ArticleThumbnail';

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
  return `/tag/${encodeURIComponent(item.value)}`;
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
    <section className="relative w-full overflow-hidden bg-white px-5 py-16 dark:bg-surface-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-300">
            <Grid3X3 className="h-4 w-4" />
            {content.badge || 'Browse by style'}
          </div>
          <h2 className="text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white">{content.title || 'Explore Creative Directions'}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
            {content.description || 'Browse by subject, genre, and visual direction — from portraits and posters to product shots and anime styles.'}
          </p>
        </div>

        <div data-reveal-stagger className="mx-auto mt-9 grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {directions.map(([item, count], index) => {
            const iconKey = (item.icon && articleIconMap[item.icon]) ? item.icon : articleIconList[index % articleIconList.length];
            const Icon = articleIconMap[iconKey];
            const accent = [
              'from-pink-500 to-rose-500',
              'from-emerald-500 to-teal-500',
              'from-violet-500 to-purple-500',
              'from-sky-500 to-blue-500',
              'from-orange-500 to-amber-500',
              'from-slate-500 to-slate-700',
              'from-fuchsia-500 to-pink-500',
              'from-blue-500 to-indigo-500',
            ][index % 8];
            return (
              <Link
                key={`${item.type}:${item.value}`}
                href={itemHref(item)}
                className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-surface-200 bg-white p-4 text-center transition duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_18px_40px_-12px_rgba(99,102,241,0.35)] dark:border-surface-800 dark:bg-surface-900/70 dark:hover:border-transparent sm:p-5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary-500/30 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md transition-transform duration-200 group-hover:scale-105 sm:h-16 sm:w-16`}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" referrerPolicy="no-referrer" />
                  ) : (
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                </span>
                <h3 className="mt-4 line-clamp-2 text-sm font-extrabold leading-snug text-surface-950 dark:text-white sm:text-base">
                  {item.label}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-surface-500 dark:text-surface-400 sm:mt-2 sm:text-sm">
                  {content.itemDescription || 'Curated prompt direction'}
                </p>
                <p className="mt-auto pt-3 text-xs font-bold text-primary-600 dark:text-primary-300 sm:text-sm">
                  {count} {count === 1 ? 'prompt' : 'prompts'}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
