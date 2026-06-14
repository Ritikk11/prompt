import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Newspaper, Sparkles, Wand2 } from 'lucide-react';
import type { Post } from '@/lib/types';

export default function HomeEditorialSections({ posts }: { posts: Post[] }) {
  const publicPosts = posts.filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private');
  const images = publicPosts
    .map(post => post.thumbnailUrl || post.images?.[0]?.url)
    .filter(Boolean) as string[];

  const cards = [
    {
      label: 'Guide',
      title: 'How to customize image prompts',
      text: 'A practical workflow for changing names, outfits, camera notes, colors, and references without breaking the prompt.',
      href: '/guides',
      icon: Wand2,
      image: images[0],
    },
    {
      label: 'Blog',
      title: 'Choosing the right AI image model',
      text: 'Quick notes on when to use ChatGPT, Gemini, Grok, Qwen, and other tools for different visual styles.',
      href: '/blog',
      icon: Newspaper,
      image: images[1],
    },
    {
      label: 'Guide',
      title: 'Using reference images properly',
      text: 'How to attach references for face, pose, outfit, and style while keeping the prompt clear.',
      href: '/guides',
      icon: BookOpen,
      image: images[2],
    },
  ];

  return (
    <section className="px-2 sm:px-0">
      <div className="overflow-hidden rounded-[28px] border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="grid gap-0 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="border-b border-surface-200 p-6 dark:border-surface-800 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Guides & Blog</p>
            <h2 className="max-w-md text-2xl font-black tracking-tight text-surface-950 dark:text-white md:text-3xl">
              Learn the workflow behind better AI prompts.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-surface-600 dark:text-surface-400">
              Short, useful articles that explain how to customize prompts, pick models, use references, and improve image results.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/guides" className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-primary-600">
                View guides <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/blog" className="inline-flex items-center gap-2 rounded-full border border-surface-200 px-4 py-2.5 text-xs font-black text-surface-800 transition-colors hover:border-primary-300 hover:text-primary-500 dark:border-surface-700 dark:text-white">
                Read blog
              </Link>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group border-b border-surface-200 p-4 transition-colors hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-950/60 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-surface-100 dark:bg-surface-800">
                    {card.image ? (
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-7 w-7 text-primary-500" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-surface-950 shadow-sm backdrop-blur dark:bg-surface-950/85 dark:text-white">
                      {card.label}
                    </span>
                  </div>
                  <h3 className="text-base font-black leading-tight text-surface-950 dark:text-white">{card.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-6 text-surface-600 dark:text-surface-400">{card.text}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-primary-500">
                    Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
