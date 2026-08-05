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
    <section className="relative w-full overflow-clip bg-white px-5 py-16 dark:bg-surface-950 sm:px-8">
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
            return (
              <Link
                key={`${item.type}:${item.value}`}
                href={itemHref(item)}
                className="group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-surface-200 bg-gradient-to-b from-white to-surface-50 p-5 text-center transition-all duration-300 hover:border-primary-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:border-surface-800 dark:from-surface-900/50 dark:to-surface-950/50 dark:hover:border-primary-500/30 dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] sm:p-6"
              >
                {/* Ambient background glow on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-primary-500/20 opacity-0 blur-[32px] transition-opacity duration-500 group-hover:opacity-100 dark:bg-primary-500/10"
                />
                
                {/* Icon Wrapper */}
                <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-surface-200 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:bg-surface-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_4px_20px_-4px_rgba(0,0,0,0.4)] dark:ring-surface-700/50 dark:group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_8px_30px_-4px_rgba(0,0,0,0.6)] sm:h-20 sm:w-20">
                  {/* Subtle inner primary glow on hover */}
                  <span className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-primary-500/10" />
                  
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.label} className="relative z-10 h-8 w-8 object-contain transition-transform duration-500 group-hover:scale-110 sm:h-10 sm:w-10" referrerPolicy="no-referrer" />
                  ) : (
                    <Icon className="relative z-10 h-8 w-8 text-primary-500 drop- transition-colors duration-500 group-hover:text-primary-400 dark:text-primary-400 dark:group-hover:text-primary-300 sm:h-10 sm:w-10" strokeWidth={2.5} />
                  )}
                </span>
                
                <h3 className="mt-5 line-clamp-2 text-sm font-extrabold leading-snug text-surface-950 transition-colors duration-300 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 sm:text-base">
                  {item.label}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-surface-500 dark:text-surface-400 sm:mt-2 sm:text-sm">
                  {content.itemDescription || 'Curated prompt direction'}
                </p>
                {!content.hidePromptCounts && (
                  <p className="mt-auto pt-3 text-xs font-bold text-primary-600 dark:text-primary-300 sm:text-sm">
                    {count} {count === 1 ? 'prompt' : 'prompts'}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
