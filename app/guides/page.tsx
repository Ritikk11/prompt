export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Layers, Wand2 } from 'lucide-react';
import { fetchPostSummaries } from '@/lib/data';
import { getPostPath } from '@/lib/sections';

export const metadata: Metadata = {
  title: 'AI Prompt Guides | AI PromptMatrix',
  description: 'Practical AI prompt guides for image generation, prompt structure, reference images, and reusable creative workflows.',
};

export default async function GuidesPage() {
  const posts = (await fetchPostSummaries())
    .filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private')
    .slice(0, 4);

  const guides = [
    {
      title: 'How to write reusable image prompts',
      category: 'Prompt basics',
      readTime: '7 min',
      text: 'Learn how to structure subject, style, lighting, camera, mood, and constraints so the prompt can be reused across ideas.',
      icon: Wand2,
      href: '/how-to-use',
    },
    {
      title: 'Choosing references without confusing the model',
      category: 'Image workflow',
      readTime: '6 min',
      text: 'Use one clear reference for identity, another for style only when needed, and keep conflicting visual directions out of the prompt.',
      icon: Layers,
      href: '/how-to-use',
    },
    {
      title: 'What makes a prompt page useful',
      category: 'Quality',
      readTime: '5 min',
      text: 'Good pages include a clear use case, example output, model notes, copy controls, and enough context to customize safely.',
      icon: CheckCircle2,
      href: '/editorial-standards',
    },
    {
      title: 'Browsing by creative direction',
      category: 'Discovery',
      readTime: '4 min',
      text: 'Start from the result you want, then narrow by format, subject, model, and visual tone instead of searching randomly.',
      icon: BookOpen,
      href: '/categories',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <section className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Guides</p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-6xl">
            Practical prompt guides for better image results.
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
          These guides explain how to use the prompt library, customize placeholders, choose reference images, and turn a prompt into a repeatable creative workflow.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {guides.map((guide, index) => {
          const Icon = guide.icon;
          const image = posts[index]?.thumbnailUrl || posts[index]?.images?.[0]?.url;
          return (
            <Link
              key={guide.title}
              href={guide.href}
              className="group overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-500/60"
            >
              <div className="relative aspect-[4/3] bg-surface-100 dark:bg-surface-800">
                {image ? (
                  <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Icon className="h-8 w-8 text-primary-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-surface-950">
                  {guide.category}
                </span>
              </div>
              <div className="p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">{guide.readTime}</p>
                <h2 className="text-lg font-black leading-tight text-surface-950 dark:text-white">{guide.title}</h2>
                <p className="mt-3 text-sm leading-6 text-surface-600 dark:text-surface-400">{guide.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-primary-500">
                  Read guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {posts.length > 0 && (
        <section className="mt-12 rounded-[28px] border border-surface-200 bg-surface-50 p-5 dark:border-surface-800 dark:bg-surface-900 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Examples</p>
              <h2 className="text-2xl font-black text-surface-950 dark:text-white">Start with a real prompt page</h2>
            </div>
            <Link href="/explore" className="hidden items-center gap-2 text-sm font-bold text-primary-500 sm:flex">
              Open library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {posts.map(post => (
              <Link key={post.id} href={getPostPath(post)} className="rounded-2xl border border-surface-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 dark:border-surface-800 dark:bg-surface-950">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-100 dark:bg-surface-800">
                  <Image src={post.thumbnailUrl || post.images?.[0]?.url || ''} alt="" fill sizes="25vw" className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <h3 className="line-clamp-2 text-sm font-black text-surface-950 dark:text-white">{post.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
