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
    <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8 md:min-h-[calc(100vh-64px)] md:py-20 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.22),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.13),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] dark:bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.25),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.1),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.2),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(#7c3aed_0.7px,transparent_0.7px)] [background-size:18px_18px] dark:opacity-[0.12]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-300" />

      <div className="mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-100/80 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-violet-100">
          <Flame className="h-4 w-4 text-amber-300" />
          Curated prompts for ChatGPT, Gemini, Grok & Qwen
        </div>

        <h1 className="max-w-5xl text-4xl font-black leading-[1.04] tracking-normal text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          {title.includes('AI Prompt') ? (
            <>
              {title.split('AI Prompt')[0]}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent dark:from-violet-200 dark:via-fuchsia-300 dark:to-pink-300">AI Prompt</span>
              {title.split('AI Prompt').slice(1).join('AI Prompt')}
            </>
          ) : (
            title
          )}
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-surface-600 dark:text-surface-300 sm:text-lg">{subtitle}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/explore" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-7 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5">
            <Search className="h-5 w-5" />
            Browse Prompts
          </Link>
          <a href="#how-it-works" className="inline-flex h-14 items-center gap-2 rounded-2xl border border-surface-200 bg-white/70 px-7 text-sm font-extrabold text-surface-900 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/8 dark:text-white dark:hover:bg-white/14">
            <Sparkles className="h-5 w-5" />
            How It Works
          </a>
        </div>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-surface-200 bg-white/70 px-4 py-4 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary-500 dark:text-violet-200" />
                  <div>
                    <div className="text-xl font-black">{item.value}</div>
                    <div className="text-xs text-surface-500 dark:text-white/60">{item.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {toolNames.length > 0 && (
          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
            {toolNames.map(tool => (
              <Link key={tool} href={`/tool/${encodeURIComponent(tool)}`} className="rounded-full border border-surface-200 bg-white/70 px-4 py-2 text-xs font-bold text-surface-700 backdrop-blur-md transition hover:border-primary-300 hover:text-primary-600 dark:border-white/12 dark:bg-white/8 dark:text-white/82 dark:hover:border-white/30 dark:hover:bg-white/14">
                {tool}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
