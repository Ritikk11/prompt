'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Check, Globe, Calendar, Heart, Bookmark, Layers, Sparkles } from 'lucide-react';
import MasonryGrid from '@/components/MasonryGrid';
import { showToast } from '@/components/ui/ToastContainer';
import type { PostSummary, SiteSettings } from '@/lib/types';

interface PublicProfileClientProps {
  profile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
    website?: string;
    joinedDate?: string | null;
  };
  submitted: PostSummary[];
  liked: PostSummary[];
  saved: PostSummary[];
  showLikes?: boolean;
  showBookmarks?: boolean;
  settings?: SiteSettings;
}

export default function PublicProfileClient({
  profile,
  submitted,
  liked,
  saved,
  showLikes = false,
  showBookmarks = false,
  settings,
}: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'liked' | 'saved'>('prompts');
  const [copied, setCopied] = useState(false);

  const totalLikesEarned = submitted.reduce((sum, p) => sum + (p.likes || 0), 0);

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        showToast('Profile link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const tabs = [
    { key: 'prompts', label: 'Prompts', count: submitted.length, icon: Layers },
    ...(showLikes ? [{ key: 'liked', label: 'Liked', count: liked.length, icon: Heart }] : []),
    ...(showBookmarks ? [{ key: 'saved', label: 'Saved', count: saved.length, icon: Bookmark }] : []),
  ];

  const activePosts =
    activeTab === 'prompts' ? submitted : activeTab === 'liked' ? liked : saved;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Creator Header Card */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-6 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.08] sm:p-8">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/90 bg-primary-500/10 shadow-lg dark:border-white/15 dark:bg-white/[0.06] sm:h-24 sm:w-24">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  fill
                  sizes="96px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-black text-primary-600 dark:text-primary-400">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-surface-950 break-words dark:text-white sm:text-2xl md:text-3xl">
                  {profile.displayName}
                </h1>
                <span className="inline-flex items-center rounded-full border border-primary-500/20 bg-primary-500/10 px-2.5 py-0.5 text-xs font-semibold text-primary-600 dark:border-primary-400/20 dark:text-primary-300">
                  @{profile.username}
                </span>
              </div>

              {profile.bio && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-surface-700 dark:text-surface-300">
                  {profile.bio}
                </p>
              )}

              {/* Creator Metadata Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-surface-600 dark:text-surface-400">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary-500" />
                  <strong className="font-bold text-surface-900 dark:text-white">{submitted.length}</strong> Prompts
                </span>

                {totalLikesEarned > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                    <strong className="font-bold text-surface-900 dark:text-white">{totalLikesEarned}</strong> Likes
                  </span>
                )}

                {profile.joinedDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 opacity-60" />
                    Joined {profile.joinedDate}
                  </span>
                )}

                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary-600 hover:underline dark:text-primary-400"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Share Profile Action */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-xl transition hover:border-white hover:bg-white hover:text-surface-950 active:scale-95 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:bg-white/[0.14] dark:hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Share Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (if multiple tabs exist) */}
      {tabs.length > 1 && (
        <div className="mb-6 flex items-center gap-1.5 border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-bold transition-colors ${
                  isTabActive
                    ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                    : 'text-surface-600 hover:bg-black/[0.04] hover:text-surface-900 dark:text-surface-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isTabActive ? 'bg-white/20 text-white' : 'bg-black/[0.05] text-surface-500 dark:bg-white/10 dark:text-surface-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Prompts Masonry Grid */}
      {activePosts.length > 0 ? (
        <MasonryGrid posts={activePosts as any} settings={settings} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/25 py-16 text-center backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
            <Sparkles className="h-6 w-6 opacity-75" />
          </div>
          <h3 className="text-base font-bold text-surface-900 dark:text-white">No prompts here yet</h3>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {activeTab === 'prompts'
              ? 'This creator has not published any prompts yet.'
              : `No ${activeTab} prompts found.`}
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-4 text-xs font-semibold text-surface-700 shadow-sm backdrop-blur-xl transition hover:bg-white hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:text-white"
          >
            Explore trending prompts
          </Link>
        </div>
      )}
    </div>
  );
}
