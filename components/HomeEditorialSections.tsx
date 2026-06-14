import Link from 'next/link';
import { ArrowRight, BadgeCheck, BookOpen, ClipboardCheck, Layers, Sparkles, Wand2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getAllTools } from '@/lib/constants';

function countItems(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item.trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(items: string[], limit: number) {
  return Object.entries(countItems(items))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export default function HomeEditorialSections({ posts }: { posts: Post[] }) {
  const publicPosts = posts.filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private');
  const creativeTags = topEntries(publicPosts.flatMap(post => post.tags || []), 6);
  const tools = topEntries(publicPosts.flatMap(post => getAllTools(post)), 4);

  const stats = [
    { label: 'Prompt collections', value: publicPosts.length.toLocaleString() },
    { label: 'Creative directions', value: creativeTags.length.toLocaleString() },
    { label: 'Supported generators', value: tools.length.toLocaleString() },
  ];

  const guides = [
    {
      title: 'How to use image prompts',
      text: 'Copy the structure, replace the placeholders, attach references when needed, then refine one detail at a time.',
      href: '/explore',
      icon: Wand2,
    },
    {
      title: 'Find the right creative direction',
      text: 'Browse poster, portrait, cinematic, anime, realistic, and design-led prompt collections without digging through every post.',
      href: '/explore',
      icon: Layers,
    },
    {
      title: 'Save ideas before generating',
      text: 'Use public accounts to keep prompts you want to test later and revisit your favorite styles from your profile.',
      href: '/profile',
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-8 px-2 sm:px-0">
      <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Curated Library</p>
            <h2 className="max-w-3xl text-2xl font-extrabold tracking-tight text-surface-950 dark:text-white md:text-3xl">
              Original image prompts organized for real creative workflows.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-surface-600 dark:text-surface-400">
              Every page is built around reusable prompts, example outputs, model notes, and practical steps so visitors can copy, customize, and generate without guessing.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stats.map(item => (
              <div key={item.label} className="rounded-xl bg-surface-50 p-3 text-center dark:bg-surface-950/70">
                <p className="text-lg font-black text-surface-950 dark:text-white">{item.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-surface-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {guides.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-500/50"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-surface-400 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="text-base font-extrabold text-surface-950 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">{item.text}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-surface-200 bg-surface-950 p-6 text-white shadow-sm dark:border-surface-800">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary-300">Quality Promise</p>
          <h2 className="text-2xl font-extrabold tracking-tight">Built to feel useful, not like a random feed.</h2>
          <p className="mt-3 text-sm leading-relaxed text-surface-300">
            The goal is simple: clear prompt context, working examples, practical model labels, and discovery pages that help visitors find the next useful idea.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Add context', text: 'Posts can include descriptions, detailed guides, model notes, and usage steps.', icon: ClipboardCheck },
            { title: 'Keep it organized', text: 'Homepage sections, custom pages, and creative filters keep browsing intentional.', icon: Layers },
            { title: 'Make it reusable', text: 'Smart templates, copy actions, and try buttons help visitors act immediately.', icon: BadgeCheck },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
                <Icon className="mb-4 h-5 w-5 text-primary-500" />
                <h3 className="text-sm font-black text-surface-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-surface-500 dark:text-surface-400">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {creativeTags.length > 0 && (
        <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Browse</p>
              <h2 className="text-xl font-extrabold tracking-tight text-surface-950 dark:text-white">Creative directions</h2>
            </div>
            <Link href="/explore" className="hidden items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-600 sm:flex">
              Open library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creativeTags.map(([tag, count], index) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="group rounded-xl border border-surface-200 bg-surface-50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white dark:border-surface-800 dark:bg-surface-950/70 dark:hover:border-primary-500/50 dark:hover:bg-surface-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-black text-surface-300">0{index + 1}</span>
                </div>
                <h3 className="text-sm font-black capitalize text-surface-950 dark:text-white">{tag}</h3>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{count} prompt{count === 1 ? '' : 's'} ready to explore</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
