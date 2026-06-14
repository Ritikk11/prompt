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

  const featured = cards[0];
  const supporting = cards.slice(1);
  const FeaturedIcon = featured.icon;

  return (
    <section className="px-2 sm:px-0">
      <div className="rounded-[32px] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-7 lg:p-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-primary-500">Guides & Blog</p>
            <h2 className="max-w-4xl text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">
              Learn the workflow behind better AI prompts.
            </h2>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link href="/guides" className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-primary-600">
              Guides <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blog" className="hidden items-center gap-2 rounded-full border border-surface-200 px-5 py-3 text-sm font-black text-surface-800 transition-colors hover:border-primary-300 hover:text-primary-500 dark:border-surface-700 dark:text-white sm:inline-flex">
              Blog
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Link
            href={featured.href}
            className="group grid overflow-hidden rounded-[28px] border border-surface-200 bg-surface-50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-surface-800 dark:bg-surface-950/60 lg:grid-cols-[0.92fr_1.08fr]"
          >
            <div className="relative min-h-[320px] bg-surface-100 dark:bg-surface-800">
              {featured.image ? (
                <Image
                  src={featured.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FeaturedIcon className="h-10 w-10 text-primary-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-surface-950 shadow-sm backdrop-blur dark:bg-surface-950/85 dark:text-white">
                Featured guide
              </span>
            </div>
            <div className="flex min-h-[320px] flex-col justify-between p-6 sm:p-8">
              <div>
                <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-950 text-white dark:bg-white dark:text-surface-950">
                  <FeaturedIcon className="h-5 w-5" />
                </span>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-primary-500">{featured.label}</p>
                <h3 className="max-w-xl text-3xl font-black leading-tight text-surface-950 dark:text-white">
                  {featured.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-surface-600 dark:text-surface-400">{featured.text}</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-black text-primary-500">
                Read guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <div className="grid gap-5">
            {supporting.map(card => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group grid overflow-hidden rounded-[28px] border border-surface-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-surface-800 dark:bg-surface-950/40 sm:grid-cols-[168px_1fr]"
                >
                  <div className="relative min-h-[190px] bg-surface-100 dark:bg-surface-800 sm:min-h-0">
                    {card.image ? (
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 180px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-8 w-8 text-primary-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-[190px] flex-col justify-between p-5">
                    <div>
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-primary-500">{card.label}</p>
                      <h3 className="text-xl font-black leading-tight text-surface-950 dark:text-white">{card.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-surface-600 dark:text-surface-400">{card.text}</p>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-primary-500">
                      Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
