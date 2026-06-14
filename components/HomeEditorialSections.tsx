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
  const categoryEntries = topEntries(publicPosts.flatMap(post => [post.category, ...(post.categories || [])].filter(Boolean) as string[]), 6);
  const creativeDirections = categoryEntries.length > 0 ? categoryEntries : topEntries(publicPosts.flatMap(post => post.tags || []), 6);
  const tools = topEntries(publicPosts.flatMap(post => getAllTools(post)), 4);

  const stats = [
    { label: 'Prompt collections', value: publicPosts.length.toLocaleString() },
    { label: 'Creative directions', value: creativeDirections.length.toLocaleString() },
    { label: 'Supported generators', value: tools.length.toLocaleString() },
  ];

  const guides = [
    {
      title: 'How to use image prompts',
      text: 'Copy the structure, replace the placeholders, attach references when needed, then refine one detail at a time.',
      href: '/how-to-use',
      icon: Wand2,
    },
    {
      title: 'Find the right creative direction',
      text: 'Browse poster, portrait, cinematic, anime, realistic, and design-led prompt collections without digging through every post.',
      href: '/categories',
      icon: Layers,
    },
    {
      title: 'Save ideas before generating',
      text: 'Use public accounts to keep prompts you want to test later and revisit your favorite styles from your profile.',
      href: '/profile',
      icon: BookOpen,
    },
  ];

  const qualityItems = [
    { title: 'Context first', text: 'Descriptions, examples, model notes, and usage steps help each post feel complete.', icon: ClipboardCheck },
    { title: 'Easy discovery', text: 'Sections, custom pages, and creative filters keep the library organized as it grows.', icon: Layers },
    { title: 'Ready to use', text: 'Copy actions, templates, and try buttons help visitors move from browsing to generating.', icon: BadgeCheck },
  ];

  const guideCards = [
    {
      title: 'How to use image prompts',
      text: 'A simple workflow for copying, customizing, adding references, and generating.',
      href: '/how-to-use',
      meta: 'Workflow',
    },
    {
      title: 'Editorial standards',
      text: 'How prompt pages are checked for usefulness, clarity, and working examples.',
      href: '/editorial-standards',
      meta: 'Trust',
    },
    {
      title: 'Prompt guides',
      text: 'Short practical guides for structure, references, reusable templates, and discovery.',
      href: '/guides',
      meta: 'Guides',
    },
  ];

  const categoryHref = (value: string) => `/category/${encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, '-'))}`;

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <section className="overflow-hidden rounded-[28px] border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary-500 via-fuchsia-500 to-cyan-400" />
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Curated Library</p>
            <h2 className="max-w-3xl text-2xl font-extrabold tracking-tight text-surface-950 dark:text-white md:text-4xl">
              Original image prompts organized for real creative workflows.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
              Every page is built around reusable prompts, example outputs, model notes, and practical steps so visitors can copy, customize, and generate without guessing.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {stats.map(item => (
                <div key={item.label} className="rounded-full border border-surface-200 bg-surface-50 px-4 py-2 dark:border-surface-800 dark:bg-surface-950/70">
                  <span className="mr-2 text-sm font-black text-surface-950 dark:text-white">{item.value}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[280px] border-t border-surface-200 bg-surface-50 p-5 dark:border-surface-800 dark:bg-surface-950/70 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.22),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.16),transparent_28%)]" />
            <div className="relative grid h-full gap-3">
              {guides.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-surface-800/80 dark:bg-surface-900/80 dark:hover:border-primary-500/50"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-950 text-white shadow-lg dark:bg-white dark:text-surface-950">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.22em] text-primary-500">Step 0{index + 1}</span>
                      <span className="block text-sm font-black text-surface-950 dark:text-white">{item.title}</span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-5 text-surface-500 dark:text-surface-400">{item.text}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-surface-400 transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-surface-200 bg-surface-950 p-5 text-white shadow-sm dark:border-surface-800 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Quality Promise</p>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Useful, organized, and ready to generate.</h2>
              <p className="mt-4 text-sm leading-7 text-surface-300">
                The site should feel like a creative library with a point of view, not a random feed. Each section gives visitors a reason to keep browsing.
              </p>
            </div>
            <Link href="/explore" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-surface-950 transition-transform hover:-translate-y-0.5">
              Open library <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {qualityItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black text-white/25">0{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-black">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-surface-300">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[28px] border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Editorial</p>
          <h2 className="text-2xl font-black tracking-tight text-surface-950 dark:text-white">Guides and review standards are now real pages.</h2>
          <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-400">
            These pages give the site more depth for visitors and reviewers: a usage guide, editorial standards, and a guides hub beyond the prompt feed.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {guideCards.map(card => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[24px] border border-surface-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-500/50"
            >
              <p className="mb-8 text-[10px] font-black uppercase tracking-[0.22em] text-primary-500">{card.meta}</p>
              <h3 className="text-base font-black text-surface-950 dark:text-white">{card.title}</h3>
              <p className="mt-2 text-xs leading-6 text-surface-500 dark:text-surface-400">{card.text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-primary-500">
                Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {creativeDirections.length > 0 && (
        <section className="overflow-hidden rounded-[28px] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Browse</p>
              <h2 className="text-xl font-extrabold tracking-tight text-surface-950 dark:text-white">Creative directions</h2>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Fast paths into the kinds of prompts people are already exploring.</p>
            </div>
            <Link href="/categories" className="hidden items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-600 sm:flex">
              View categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
            {creativeDirections.map(([direction, count], index) => (
              <Link
                key={direction}
                href={categoryEntries.length > 0 ? categoryHref(direction) : `/tag/${encodeURIComponent(direction)}`}
                className="group relative min-h-[168px] w-[245px] shrink-0 overflow-hidden rounded-3xl border border-surface-200 bg-surface-50 p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white dark:border-surface-800 dark:bg-surface-950/70 dark:hover:border-primary-500/50 dark:hover:bg-surface-900"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-500/10 transition-transform group-hover:scale-125" />
                <div className="relative mb-6 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-surface-400 shadow-sm dark:bg-surface-900">0{index + 1}</span>
                </div>
                <h3 className="relative text-lg font-black capitalize text-surface-950 dark:text-white">{direction}</h3>
                <p className="relative mt-2 text-xs leading-5 text-surface-500 dark:text-surface-400">
                  {count} ready-to-copy prompt{count === 1 ? '' : 's'} with examples and model notes.
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
