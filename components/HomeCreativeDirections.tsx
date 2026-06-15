import Link from 'next/link';
import { Aperture, Camera, Gem, Globe2, Grid3X3, Palette, Sparkles, Wand2 } from 'lucide-react';
import type { FilterRailItem, Post, SiteSettings } from '@/lib/types';

const icons = [Camera, Globe2, Palette, Sparkles, Gem, Grid3X3, Wand2, Aperture];
const accents = [
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
  'from-orange-500 to-amber-500',
  'from-slate-500 to-slate-700',
  'from-fuchsia-500 to-pink-500',
  'from-blue-500 to-indigo-500',
];

function titleCase(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function countMatches(posts: Post[], item: FilterRailItem) {
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

function itemHref(item: FilterRailItem) {
  if (item.type === 'tool') return `/tool/${encodeURIComponent(item.value)}`;
  if (item.type === 'category') return `/explore?category=${encodeURIComponent(item.value)}`;
  return `/tag/${encodeURIComponent(item.value)}`;
}

export default function HomeCreativeDirections({ posts, settings }: { posts: Post[]; settings?: SiteSettings }) {
  const counts = new Map<string, number>();
  posts.forEach(post => {
    const values = [...(post.categories || []), post.category, ...(post.tags || [])].filter(Boolean) as string[];
    values.slice(0, 4).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  });

  const customDirections = settings?.creativeDirectionItems?.filter(item => item.label && item.value) || [];
  const directions = customDirections.length > 0
    ? customDirections.map(item => [item, countMatches(posts, item)] as const).filter(([, count]) => count > 0).slice(0, 8)
    : Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => [{ label: titleCase(name), value: name, type: 'tag' as const }, count] as const);

  if (directions.length === 0) return null;

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-white px-5 py-16 dark:bg-surface-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-300">
          <Grid3X3 className="h-4 w-4" />
          Browse by style
        </div>
        <h2 className="text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white">Explore Creative Directions</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
          Jump into prompt collections by subject, genre, and visual direction using your real post tags.
        </p>
      </div>

      <div className="mx-auto mt-9 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {directions.map(([item, count], index) => {
          const Icon = icons[index % icons.length];
          return (
            <Link key={`${item.type}:${item.value}`} href={itemHref(item)} className="rounded-2xl border border-surface-200 bg-surface-50 p-5 transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-surface-800 dark:bg-surface-900/70 dark:hover:border-primary-500/60">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accents[index % accents.length]} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-extrabold text-surface-950 dark:text-white">{item.label}</h3>
              <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Curated prompt direction</p>
              <p className="mt-4 text-sm font-bold text-primary-600 dark:text-primary-300">{count} {count === 1 ? 'prompt' : 'prompts'}</p>
            </Link>
          );
        })}
      </div>
      </div>
    </section>
  );
}
