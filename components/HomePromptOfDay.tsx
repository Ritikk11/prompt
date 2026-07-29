import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Cpu, Crown, Heart, Tag } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools } from '@/lib/constants';
import { getPromptImageUrl } from '@/lib/image-url';

export default function HomePromptOfDay({ post, settings }: { post?: Post; settings?: SiteSettings }) {
  if (!post) return null;

  const content = settings?.homepageContent?.promptOfDay || {};
  const prompt = post.images?.[0]?.prompt || post.description;
  const tools = getAllTools(post).slice(0, 3);
  const category = post.category || post.categories?.[0] || post.tags?.[0] || 'Creative prompt';
  const imageUrl = getPromptImageUrl(post.thumbnailUrl || post.images?.[0]?.url, { width: 960, quality: 78 });

  return (
    <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.22),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.13),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] dark:bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.25),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.1),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.2),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(#7c3aed_0.7px,transparent_0.7px)] [background-size:18px_18px] dark:opacity-[0.12]" />

      <div className="relative mx-auto max-w-6xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/80 px-4 py-2 text-xs font-bold text-amber-800 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-amber-200">
          <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          {content.badge || 'Prompt of the Day'}
        </div>
        <h2 className="text-3xl font-black tracking-normal text-surface-950 dark:text-white sm:text-4xl">{content.title || "Today's Featured Prompt"}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-300">{content.description || 'Handpicked from your published featured prompts'}</p>

        <div className={`mx-auto mt-8 grid overflow-hidden rounded-[28px] border border-surface-200 bg-white/20 text-left shadow-[0_34px_90px_rgba(83,54,118,0.12)] dark:shadow-[0_34px_90px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-white/5 ${imageUrl ? 'lg:grid-cols-[0.95fr_1.05fr]' : 'max-w-4xl'}`}>
          {imageUrl && (
            <Link href={`/${post.slug || post.id}`} className="group relative flex min-h-[320px] items-center justify-center overflow-hidden p-4 sm:min-h-[420px] sm:p-6 lg:min-h-full">
              <div className="relative flex h-full max-h-[520px] w-full items-center justify-center overflow-hidden rounded-3xl">
                <Image
                  src={imageUrl}
                  alt={post.title}
                  width={720}
                  height={960}
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="max-h-[520px] w-auto max-w-full rounded-3xl object-contain transition duration-700 group-hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <span className="absolute left-5 top-5 rounded-full bg-black/60 px-4 py-1.5 text-xs font-black text-white backdrop-blur-md">
                Featured
              </span>
            </Link>
          )}

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold text-surface-950 dark:text-white">{post.title}</h3>
              <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black text-amber-950">Featured</span>
            </div>
            <div className="mt-5 rounded-2xl bg-black/5 dark:bg-black/35 border border-transparent p-5 text-sm leading-7 text-surface-800 dark:text-white/90 line-clamp-5">
              {prompt}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-surface-600 dark:text-white/80">
              <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" /> {category}</span>
              {tools.length > 0 && (
                <span className="inline-flex items-start gap-2">
                  <Cpu className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-snug">Best for {tools.join(', ')}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> {post.likes || 0} likes</span>
            </div>
            <Link href={`/${post.slug || post.id}`} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5">
              {content.ctaLabel || 'View This Prompt'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
