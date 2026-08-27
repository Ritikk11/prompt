import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Cpu, Crown, Heart, Tag } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools } from '@/lib/constants';
import { getPromptImageUrl } from '@/lib/image-url';
import { GlmSectionHeader, glassCard } from './GlmSection';
import GlmReveal from './GlmReveal';

/*
 * Glassmorphic adaptation of HomePromptOfDay for the /test redesign.
 * Main's version paints its own opaque full-bleed background; here the GLM
 * page background shows through, so the section is just the centered header
 * plus one large glass panel (image + prompt text + meta + CTA).
 */

export default function GlmPromptOfDay({ post, settings }: { post?: Post; settings?: SiteSettings }) {
  if (!post) return null;

  const content = settings?.homepageContent?.promptOfDay || {};
  const prompt = post.images?.[0]?.prompt || post.description;
  const tools = getAllTools(post).slice(0, 3);
  const category = post.category || post.categories?.[0] || post.tags?.[0] || 'Creative prompt';
  const imageUrl = getPromptImageUrl(post.thumbnailUrl || post.images?.[0]?.url, { width: 960, quality: 78 });

  return (
    <section className="w-full px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <GlmReveal slide>
          <GlmSectionHeader
            icon={<Crown className="h-4 w-4 text-amber-500" />}
            badge={content.badge || 'Prompt of the Day'}
            title={content.title || "Today's Featured Prompt"}
            accentWord="Featured"
            description={content.description || 'Handpicked from your published featured prompts'}
          />
        </GlmReveal>

        <GlmReveal>
          <div className={`mx-auto grid overflow-hidden rounded-[28px] text-left ${glassCard} ${imageUrl ? 'lg:grid-cols-[0.95fr_1.05fr]' : 'max-w-4xl'}`}>
            {imageUrl && (
              <Link
                href={`/${post.slug || post.id}`}
                className="group relative flex min-h-[320px] items-center justify-center overflow-hidden p-4 sm:min-h-[420px] sm:p-6 lg:min-h-full"
              >
                <div className="relative h-full max-h-[520px] w-full overflow-hidden rounded-2xl">
                  <Image
                    src={imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="object-contain transition duration-700 group-hover:scale-[1.02]"
                  />
                </div>
                <span className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/65 px-4 py-1.5 text-xs font-black text-white">
                  Featured
                </span>
              </Link>
            )}

            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-extrabold text-surface-950 dark:text-white">{post.title}</h3>
                <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black text-amber-950">Featured</span>
              </div>
              <div className="mt-5 rounded-2xl border border-white/40 bg-white/30 p-5 text-sm leading-7 text-surface-800 line-clamp-5 dark:border-white/10 dark:bg-black/30 dark:text-white/90">
                {prompt}
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-surface-600 dark:text-white/80">
                <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" /> {category}</span>
                {tools.length > 0 && (
                  <span className="inline-flex items-start gap-2">
                    <Cpu className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="leading-snug">Best for {tools.join(', ')}</span>
                  </span>
                )}
                {settings?.features?.showLikeCount !== false && (
                  <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> {post.likes || 0} likes</span>
                )}
              </div>
              <Link
                href={`/${post.slug || post.id}`}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/75 py-3 text-sm font-bold text-surface-800 shadow-sm transition hover:border-primary-400/60 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.12] dark:text-white dark:hover:text-primary-300"
              >
                {content.ctaLabel || 'View This Prompt'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </GlmReveal>
      </div>
    </section>
  );
}
