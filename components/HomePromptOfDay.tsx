import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Crown, Heart, Tag, Wand2 } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools } from '@/lib/constants';

export default function HomePromptOfDay({ post, settings }: { post?: Post; settings?: SiteSettings }) {
  if (!post) return null;

  const content = settings?.homepageContent?.promptOfDay || {};
  const prompt = post.images?.[0]?.prompt || post.description;
  const tools = getAllTools(post).slice(0, 3);
  const category = post.category || post.categories?.[0] || post.tags?.[0] || 'Creative prompt';
  const imageUrl = post.thumbnailUrl || post.images?.[0]?.url;

  return (
    <section className="relative w-full overflow-hidden rounded-[32px] border border-white/5 bg-gradient-to-br from-indigo-950 via-purple-950 to-rose-950 px-4 py-12 text-white shadow-xl sm:px-8 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="relative mx-auto max-w-6xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/10 px-4 py-2 text-xs font-bold text-amber-200 backdrop-blur-md">
          <Crown className="h-4 w-4 text-amber-400" />
          {content.badge || 'Prompt of the Day'}
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{content.title || "Today's Featured Prompt"}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-white/70 sm:text-sm">{content.description || 'Handpicked from your published featured prompts'}</p>

        <div className={`mx-auto mt-8 grid overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-2xl backdrop-blur-md ${imageUrl ? 'lg:grid-cols-[0.95fr_1.05fr]' : 'max-w-4xl'}`}>
          {imageUrl && (
            <Link href={`/${post.slug || post.id}`} className="group relative flex min-h-[320px] items-center justify-center overflow-hidden bg-black/20 p-4 sm:min-h-[420px] sm:p-6 lg:min-h-full">
              <div className="relative flex h-full max-h-[520px] w-full items-center justify-center overflow-hidden rounded-3xl bg-black/20">
                <Image
                  src={imageUrl}
                  alt={post.title}
                  width={720}
                  height={960}
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="max-h-[520px] w-auto max-w-full rounded-3xl object-contain transition duration-700 group-hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
              <span className="absolute left-5 top-5 rounded-full bg-black/45 px-4 py-1.5 text-xs font-black text-white backdrop-blur-md">
                Featured
              </span>
            </Link>
          )}

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold">{post.title}</h3>
              <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black text-amber-950">Featured</span>
            </div>
            <div className="mt-5 rounded-2xl bg-black/20 p-5 text-sm leading-7 text-white/90 line-clamp-5">
              {prompt}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/80">
              <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" /> {category}</span>
              {tools.length > 0 && (
                <span className="inline-flex items-start gap-2">
                  <Wand2 className="mt-0.5 h-4 w-4 shrink-0" />
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
