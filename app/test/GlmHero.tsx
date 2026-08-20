'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Compass, BookOpen } from 'lucide-react';
import type { PostSummary, SiteSettings } from '@/lib/types';
import { getPromptImageUrl } from '@/lib/image-url';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = to;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [to]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function GlmHero({
  featuredPosts = [],
  totalPosts = 0,
  settings,
}: {
  featuredPosts: PostSummary[];
  totalPosts: number;
  settings?: SiteSettings;
}) {
  // Built-in fallback showcase artwork cards if fewer than 3 posts exist
  const showcaseDefaults = [
    {
      img: '/test-assets/art-surreal.jpg',
      title: 'Surreal Dreamscape',
      tag: 'ChatGPT',
      slug: '',
      className: 'rotate-[-6deg]',
      animation: '[animation:float_9s_ease-in-out_infinite]',
      z: 'z-20',
      delay: '0s',
    },
    {
      img: '/test-assets/art-figurine.jpg',
      title: '3D Figurine Trend',
      tag: 'Gemini',
      slug: '',
      className: 'rotate-[1deg] -translate-y-6',
      animation: '[animation:float_13s_ease-in-out_infinite]',
      z: 'z-30',
      delay: '0.6s',
    },
    {
      img: '/test-assets/art-retro.jpg',
      title: 'Retro Film Portrait',
      tag: 'Grok',
      slug: '',
      className: 'rotate-[6deg]',
      animation: '[animation:float_9s_ease-in-out_infinite]',
      z: 'z-20',
      delay: '1.2s',
    },
  ];

  // Map real featured posts into showcase cards if available
  const cards = showcaseDefaults.map((def, idx) => {
    const post = featuredPosts[idx];
    if (!post) return def;
    const postImg = post.thumbnailUrl || (post as any).images?.[0]?.url || def.img;
    const primaryTool = (post as any).aiTools?.[0] || (post.images?.[0] as any)?.aiTool || def.tag;
    return {
      ...def,
      img: getPromptImageUrl(postImg, { width: 640, quality: 80 }) || def.img,
      title: post.title || def.title,
      tag: primaryTool,
      slug: post.slug || post.id,
    };
  });

  const totalLikes = featuredPosts.reduce((acc, p) => acc + (p.likes || 0), 14);

  const stats = [
    { value: totalPosts || 120, suffix: '+', label: 'Curated Prompts' },
    { value: featuredPosts.length || 6, suffix: '', label: 'Featured Visuals' },
    { value: totalLikes, suffix: '+', label: 'Creator Likes' },
    { value: settings?.aiTools?.length || 4, suffix: '', label: 'Supported AI Tools' },
  ];

  return (
    <section className="relative px-4 pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="mx-auto max-w-5xl text-center">
        {/* Glowing Pill Beacon */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/80 bg-[#101129]/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-purple-950/30">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e64bd6] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e64bd6]" />
          </span>
          <span>Curated prompts for ChatGPT · Gemini · Grok · Qwen</span>
        </div>

        {/* Hero Title with Shimmer Gradient */}
        <h1 className="mt-7 text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl font-sans leading-[1.08]">
          Discover AI Prompt <br className="hidden sm:block" />
          <span className="text-gradient-shimmer">Masterpieces</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
          Explore polished prompt examples, finished visuals, and copy-ready workflows for your next creation — all reviewed, tagged, and ready to paste into your favourite AI tool.
        </p>

        {/* Dual Action Buttons */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/explore"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#e64bd6] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-900/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-700/50"
          >
            <Compass className="w-4 h-4" />
            Explore prompts
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all duration-300 hover:border-white/20"
          >
            <BookOpen className="w-4 h-4 text-white/70" />
            Browse guides
          </Link>
        </div>
      </div>

      {/* Floating 3D Showcase Artwork Cards */}
      <div className="relative mx-auto mt-16 sm:mt-20 flex max-w-4xl items-center justify-center gap-3 px-4 sm:gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`relative ${card.z}`}>
            <div className={`${card.className} transition-transform duration-500 hover:rotate-0 hover:scale-105`}>
              <div className={card.animation} style={{ animationDelay: card.delay }}>
                <Link
                  href={card.slug ? `/${card.slug}` : '/explore'}
                  className="group block relative w-[28vw] max-w-[260px] overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/80 backdrop-blur-md sm:w-[230px] transition-all duration-300 hover:border-white/30"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-900">
                    <img
                      src={card.img}
                      alt={card.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
                      {card.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-3 bg-[#08091a]/80 backdrop-blur-sm border-t border-white/5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e64bd6] shrink-0" />
                    <span className="text-xs font-medium text-white/90 truncate group-hover:text-white transition-colors">
                      {card.title}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Live Stats Bar */}
      <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-4 shadow-2xl shadow-purple-950/20">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#08091a]/70 px-4 py-6 text-center backdrop-blur-md">
            <div className="text-3xl font-bold text-white sm:text-4xl tracking-tight">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <div className="mt-1.5 text-xs text-white/60 sm:text-sm font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Keyframe Styles for Title Gradient Shimmer and Floating */}
      <style jsx>{`
        .text-gradient-shimmer {
          background: linear-gradient(90deg, #a855f7 0%, #e64bd6 30%, #2dd4bf 70%, #a855f7 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: textShimmer 6s linear infinite;
        }
        @keyframes textShimmer {
          from {
            background-position: 200% center;
          }
          to {
            background-position: -200% center;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(1.5deg);
          }
        }
      `}</style>
    </section>
  );
}
