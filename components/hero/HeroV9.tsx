'use client';
import Link from 'next/link';
import { Heart, Bookmark, Flame, Sparkles, Wand2 } from 'lucide-react';
import { getAllTools } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import { promptImageUrl, type HeroProps } from './sliderShared';

// V9: Static landing hero with preview grid
export default function HeroV9({ featuredPosts: featured, settings, stats }: HeroProps) {
  const post = featured[0];
  const allTools = post ? getAllTools(post) : [];
  const previewPosts = featured.slice(0, 4);
  const displayTitle = settings.heroTitle || 'Better Image Prompts Start Here';
  const displaySubtitle = settings.heroSubtitle || settings.siteDescription;
  const tools = (settings.aiTools || allTools).filter(Boolean).slice(0, 4);
  const totalLikes = featured.reduce((sum, item) => sum + (item.likes || 0), 0);
  const totalSaves = featured.reduce((sum, item) => sum + (item.bookmarkedBy?.length || 0), 0);
  const statItems = [
    { label: 'Prompt sets', value: `${stats?.postCount ?? featured.length}+`, icon: Sparkles },
    { label: 'Featured picks', value: `${featured.length}`, icon: Flame },
    { label: 'Likes', value: `${totalLikes}`, icon: Heart },
    { label: 'Saves', value: `${totalSaves}`, icon: Bookmark },
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#221941] px-5 py-14 text-white shadow-[0_30px_90px_rgba(25,14,58,0.35)] sm:px-8 md:py-20 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_14%,rgba(124,58,237,0.34),transparent_35%),radial-gradient(circle_at_76%_16%,rgba(236,72,153,0.22),transparent_36%),linear-gradient(135deg,#17172f_0%,#53208d_54%,#211a45_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/18 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-amber-200 shadow-sm backdrop-blur-md">
          <Flame className="h-4 w-4 text-amber-300" />
          Curated prompts for ChatGPT, Gemini, Grok & Qwen
        </div>

        <h1 className="max-w-5xl text-4xl font-black leading-[1.04] tracking-normal text-white sm:text-6xl lg:text-7xl">
          {displayTitle.split('AI Prompt').length > 1 ? (
            <>
              {displayTitle.split('AI Prompt')[0]}
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">AI Prompt</span>
              {displayTitle.split('AI Prompt').slice(1).join('AI Prompt')}
            </>
          ) : (
            displayTitle
          )}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/82 sm:text-lg">
          {displaySubtitle}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/explore" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-7 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5">
            <Sparkles className="h-5 w-5" />
            Browse Prompts
          </Link>
          <a href="#how-it-works" className="inline-flex h-14 items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-7 text-sm font-extrabold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14">
            <Wand2 className="h-5 w-5" />
            How It Works
          </a>
        </div>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-left backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-violet-200" />
                  <div>
                    <div className="text-xl font-black">{item.value}</div>
                    <div className="text-xs text-white/60">{item.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {tools.length > 0 && (
          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
            {tools.map(tool => (
              <Link key={tool} href={`/tool/${encodeURIComponent(tool)}`} className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-bold text-white/82 backdrop-blur-md transition hover:border-white/30 hover:bg-white/14">
                {tool}
              </Link>
            ))}
          </div>
        )}

        {previewPosts.length > 0 && (
          <div className="pointer-events-none mt-10 hidden w-full max-w-5xl grid-cols-4 gap-4 opacity-70 lg:grid">
            {previewPosts.map((p, index) => (
              <div key={p.id} className={`relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl ${index % 2 ? 'translate-y-6' : ''}`}>
                <LoadingImage
                  src={promptImageUrl(p, 'https://picsum.photos/seed/placeholder/600/750')}
                  alt=""
                  fill
                  showSkeleton={false}
                  className="object-cover"
                  sizes="18vw"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
