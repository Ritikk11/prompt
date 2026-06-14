import Link from 'next/link';
import { ArrowRight, Bookmark, Flame, Heart, Search, Sparkles } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';

type HomeLibraryHeroProps = {
  featuredPosts: Post[];
  settings: SiteSettings;
  postCount: number;
};

export default function HomeLibraryHero({ featuredPosts, settings, postCount }: HomeLibraryHeroProps) {
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalSaves = featuredPosts.reduce((sum, post) => sum + (post.bookmarkedBy?.length || 0), 0);
  const toolNames = (settings.aiTools || []).filter(Boolean).slice(0, 4);
  const title = settings.heroTitle || 'Your Ultimate AI Prompt Library';
  const subtitle = settings.heroSubtitle || 'Discover curated prompts for ChatGPT, Gemini, Grok, Qwen, and other image tools. Copy, customize, and generate stronger AI art from one organized library.';

  const statItems = [
    { label: 'Prompts', value: `${postCount}+`, icon: Sparkles },
    { label: 'Featured', value: `${featuredPosts.length}`, icon: Flame },
    { label: 'Likes', value: `${totalLikes}`, icon: Heart },
    { label: 'Saves', value: `${totalSaves}`, icon: Bookmark },
  ];

  return (
    <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-[#211640] px-5 py-16 text-white shadow-[0_30px_90px_rgba(25,14,58,0.24)] sm:px-8 md:min-h-[calc(100vh-64px)] md:py-20 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_23%_12%,rgba(124,58,237,0.34),transparent_35%),radial-gradient(circle_at_80%_18%,rgba(236,72,153,0.26),transparent_36%),linear-gradient(135deg,#15172f_0%,#5a1f91_52%,#231941_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute left-1/2 top-10 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-amber-200 shadow-sm backdrop-blur-md">
          <Flame className="h-4 w-4 text-amber-300" />
          Curated prompts for ChatGPT, Gemini, Grok & Qwen
        </div>

        <h1 className="max-w-5xl text-4xl font-black leading-[1.04] tracking-normal text-white sm:text-6xl lg:text-7xl">
          {title.includes('AI Prompt') ? (
            <>
              {title.split('AI Prompt')[0]}
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">AI Prompt</span>
              {title.split('AI Prompt').slice(1).join('AI Prompt')}
            </>
          ) : (
            title
          )}
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-white/82 sm:text-lg">{subtitle}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/explore" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-7 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5">
            <Search className="h-5 w-5" />
            Browse Prompts
          </Link>
          <a href="#how-it-works" className="inline-flex h-14 items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-7 text-sm font-extrabold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14">
            <Sparkles className="h-5 w-5" />
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

        {toolNames.length > 0 && (
          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
            {toolNames.map(tool => (
              <Link key={tool} href={`/tool/${encodeURIComponent(tool)}`} className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-bold text-white/82 backdrop-blur-md transition hover:border-white/30 hover:bg-white/14">
                {tool}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
