'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Eye,
  Heart,
  Bookmark,
  TrendingUp,
  BarChart2,
  Search,
  ArrowUpDown,
  ExternalLink,
  Edit3,
  Download,
  Sparkles,
  Layers,
  Cpu,
  Tag,
  Trophy,
  Filter,
  Check,
  ChevronDown,
  Calendar,
  Clock
} from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools, getToolInfo } from '@/lib/constants';
import { TabBanner, AdminSelect, adminInputOnCard } from '@/components/admin/AdminUI';
import { showToast } from '@/components/ui/ToastContainer';

interface StatsTabProps {
  posts: Post[];
  settings: SiteSettings;
  onEditPost: (post: Post) => void;
}

type SortField = 'views' | 'likes' | 'saves' | 'engagement' | 'newest';
export type TimeframeFilter =
  | 'all'
  | '24h'
  | '48h'
  | '7d'
  | '14d'
  | '30d'
  | '60d'
  | '90d'
  | '180d'
  | '1y'
  | 'custom';

export interface TimeframeOption {
  key: TimeframeFilter;
  label: string;
  shortLabel: string;
  days?: number;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { key: 'all', label: 'All Time', shortLabel: 'All Time' },
  { key: '24h', label: 'Today (24h)', shortLabel: '24h', days: 1 },
  { key: '48h', label: 'Last 48 Hours', shortLabel: '48h', days: 2 },
  { key: '7d', label: 'Last 7 Days', shortLabel: '7D', days: 7 },
  { key: '14d', label: 'Last 14 Days', shortLabel: '14D', days: 14 },
  { key: '30d', label: 'Last 30 Days', shortLabel: '30D', days: 30 },
  { key: '60d', label: 'Last 60 Days', shortLabel: '60D', days: 60 },
  { key: '90d', label: 'Last 3 Months', shortLabel: '90D', days: 90 },
  { key: '180d', label: 'Last 6 Months', shortLabel: '6M', days: 180 },
  { key: '1y', label: 'Last 1 Year', shortLabel: '1Y', days: 365 },
  { key: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
];

export default function StatsTab({ posts, settings, onEditPost }: StatsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortField, setSortField] = useState<SortField>('views');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeView, setActiveView] = useState<'all' | 'leaderboard' | 'breakdowns'>('all');

  // Filter posts by timeframe first
  const timeframeFilteredPosts = useMemo(() => {
    if (timeframe === 'all') return posts;

    if (timeframe === 'custom') {
      const start = customStartDate ? new Date(customStartDate).getTime() : 0;
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`).getTime() : Infinity;
      return posts.filter(p => {
        const time = new Date(p.createdAt || p.updatedAt || 0).getTime();
        return time >= start && time <= end;
      });
    }

    const opt = TIMEFRAME_OPTIONS.find(o => o.key === timeframe);
    if (!opt || !opt.days) return posts;

    const cutoff = Date.now() - opt.days * 24 * 60 * 60 * 1000;
    return posts.filter(p => {
      const time = new Date(p.createdAt || p.updatedAt || 0).getTime();
      return time >= cutoff;
    });
  }, [posts, timeframe, customStartDate, customEndDate]);

  const activeTimeframeLabel = useMemo(() => {
    if (timeframe === 'custom') {
      if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
      if (customStartDate) return `From ${customStartDate}`;
      if (customEndDate) return `Until ${customEndDate}`;
      return 'Custom Range';
    }
    return TIMEFRAME_OPTIONS.find(o => o.key === timeframe)?.label || 'All Time';
  }, [timeframe, customStartDate, customEndDate]);

  // Overall Global KPI Metrics
  const metrics = useMemo(() => {
    const list = timeframeFilteredPosts;
    const totalViews = list.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalLikes = list.reduce((acc, p) => acc + (p.likes || p.likedBy?.length || 0), 0);
    const totalSaves = list.reduce((acc, p) => acc + (p.bookmarkedBy?.length || 0), 0);
    const avgViews = list.length > 0 ? Math.round(totalViews / list.length) : 0;
    const avgLikes = list.length > 0 ? (totalLikes / list.length).toFixed(1) : '0';
    const engagementRate = totalViews > 0 ? (((totalLikes + totalSaves) / totalViews) * 100).toFixed(1) : '0.0';

    const topPost = [...list].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || null;

    return {
      totalViews,
      totalLikes,
      totalSaves,
      avgViews,
      avgLikes,
      engagementRate,
      topPost,
      count: list.length,
    };
  }, [timeframeFilteredPosts]);

  // Available Tools and Categories for Filter Dropdowns
  const availableTools = useMemo(() => {
    return Array.from(new Set(posts.flatMap(p => getAllTools(p)).filter(Boolean))).sort();
  }, [posts]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => {
      if (p.category) set.add(p.category.trim());
      (p.categories || []).forEach(c => c && set.add(c.trim()));
    });
    return Array.from(set).sort();
  }, [posts]);

  // Filtered & Sorted Posts for the Leaderboard
  const displayPosts = useMemo(() => {
    let result = [...timeframeFilteredPosts];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        getAllTools(p).some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedTool) {
      const target = selectedTool.toLowerCase();
      result = result.filter(p => getAllTools(p).some(t => t.toLowerCase() === target));
    }

    if (selectedCategory) {
      const target = selectedCategory.toLowerCase();
      result = result.filter(p =>
        (p.category && p.category.toLowerCase() === target) ||
        (p.categories && p.categories.some(c => c.toLowerCase() === target))
      );
    }

    result.sort((a, b) => {
      const aViews = a.views || 0;
      const bViews = b.views || 0;
      const aLikes = a.likes || a.likedBy?.length || 0;
      const bLikes = b.likes || b.likedBy?.length || 0;
      const aSaves = a.bookmarkedBy?.length || 0;
      const bSaves = b.bookmarkedBy?.length || 0;

      if (sortField === 'views') return bViews - aViews;
      if (sortField === 'likes') return bLikes - aLikes;
      if (sortField === 'saves') return bSaves - aSaves;
      if (sortField === 'engagement') {
        const aRate = aViews > 0 ? (aLikes + aSaves) / aViews : 0;
        const bRate = bViews > 0 ? (bLikes + bSaves) / bViews : 0;
        return bRate - aRate;
      }
      if (sortField === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [timeframeFilteredPosts, search, selectedTool, selectedCategory, sortField]);

  // Highest views in display list (for progress bar width scaling)
  const maxViewsInList = useMemo(() => {
    return Math.max(1, ...displayPosts.map(p => p.views || 0));
  }, [displayPosts]);

  // Tool Analytics Breakdown
  const toolStats = useMemo(() => {
    const map = new Map<string, { count: number; views: number; likes: number }>();
    timeframeFilteredPosts.forEach(p => {
      const tools = getAllTools(p);
      const views = p.views || 0;
      const likes = p.likes || p.likedBy?.length || 0;
      tools.forEach(t => {
        const key = t.trim();
        if (!key) return;
        const existing = map.get(key) || { count: 0, views: 0, likes: 0 };
        existing.count += 1;
        existing.views += views;
        existing.likes += likes;
        map.set(key, existing);
      });
    });

    const totalViewsAll = Math.max(1, timeframeFilteredPosts.reduce((sum, p) => sum + (p.views || 0), 0));

    return Array.from(map.entries())
      .map(([tool, data]) => ({
        tool,
        count: data.count,
        views: data.views,
        likes: data.likes,
        avgViews: Math.round(data.views / data.count),
        percentage: ((data.views / totalViewsAll) * 100).toFixed(1),
      }))
      .sort((a, b) => b.views - a.views);
  }, [timeframeFilteredPosts]);

  // Category Analytics Breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; views: number; likes: number }>();
    timeframeFilteredPosts.forEach(p => {
      const cats = [p.category, ...(p.categories || [])].filter(Boolean) as string[];
      const views = p.views || 0;
      const likes = p.likes || p.likedBy?.length || 0;
      cats.forEach(c => {
        const key = c.trim();
        if (!key) return;
        const existing = map.get(key) || { count: 0, views: 0, likes: 0 };
        existing.count += 1;
        existing.views += views;
        existing.likes += likes;
        map.set(key, existing);
      });
    });

    const totalViewsAll = Math.max(1, timeframeFilteredPosts.reduce((sum, p) => sum + (p.views || 0), 0));

    return Array.from(map.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        views: data.views,
        likes: data.likes,
        avgViews: Math.round(data.views / data.count),
        percentage: ((data.views / totalViewsAll) * 100).toFixed(1),
      }))
      .sort((a, b) => b.views - a.views);
  }, [timeframeFilteredPosts]);

  // Top Tags by Views
  const topTags = useMemo(() => {
    const map = new Map<string, { count: number; views: number }>();
    timeframeFilteredPosts.forEach(p => {
      (p.tags || []).forEach(t => {
        const key = t.trim();
        if (!key) return;
        const existing = map.get(key) || { count: 0, views: 0 };
        existing.count += 1;
        existing.views += (p.views || 0);
        map.set(key, existing);
      });
    });

    return Array.from(map.entries())
      .map(([tag, data]) => ({ tag, count: data.count, views: data.views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 16);
  }, [timeframeFilteredPosts]);

  // Export Stats as CSV
  const exportCsv = () => {
    const headers = ['ID', 'Title', 'Slug', 'Category', 'AI Tools', 'Tags', 'Views', 'Likes', 'Saves', 'Engagement Rate %', 'Status', 'Created At'];
    const rows = displayPosts.map(p => {
      const views = p.views || 0;
      const likes = p.likes || p.likedBy?.length || 0;
      const saves = p.bookmarkedBy?.length || 0;
      const engRate = views > 0 ? (((likes + saves) / views) * 100).toFixed(1) : '0.0';
      return [
        `"${p.id}"`,
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${p.slug || ''}"`,
        `"${p.category || ''}"`,
        `"${getAllTools(p).join(', ')}"`,
        `"${(p.tags || []).join(', ')}"`,
        views,
        likes,
        saves,
        engRate,
        `"${p.status || 'published'}"`,
        `"${p.createdAt}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `promptmatrix_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported stats CSV successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <TabBanner
        icon={<BarChart2 className="w-5 h-5 text-primary-500" />}
        title="Stats & Analytics"
        text="Monitor prompt views, readership engagement, AI tool distributions, and audience trends across your library."
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-xl hover:bg-white hover:text-surface-950 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:bg-white/[0.12] dark:hover:text-white transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        }
      />

      {/* Timeframe & View Mode Controls */}
      <div className="space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Timeframe Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 no-scrollbar rounded-2xl border border-white/80 bg-white/60 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] shadow-sm">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider shrink-0">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              <span>Time:</span>
            </div>
            {TIMEFRAME_OPTIONS.map(tf => {
              const active = timeframe === tf.key;
              return (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => setTimeframe(tf.key)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                      : 'text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                  title={tf.label}
                >
                  {tf.key === 'custom' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {tf.shortLabel}
                    </span>
                  ) : (
                    tf.shortLabel
                  )}
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/80 bg-white/60 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] shadow-sm shrink-0 self-start xl:self-auto">
            {(['all', 'leaderboard', 'breakdowns'] as const).map(v => {
              const labels = {
                all: 'Overview',
                leaderboard: 'Top Prompts',
                breakdowns: 'Distributions',
              };
              const active = activeView === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setActiveView(v)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                      : 'text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-white'
                  }`}
                >
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Range Picker Bar (visible when Custom is selected) */}
        {timeframe === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl border border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/[0.04] backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-300">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span>Custom Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-surface-900 px-3 py-1.5 text-xs font-medium text-surface-900 dark:text-surface-100 outline-none focus:ring-2 focus:ring-primary-500/30 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-surface-900 px-3 py-1.5 text-xs font-medium text-surface-900 dark:text-surface-100 outline-none focus:ring-2 focus:ring-primary-500/30 shadow-sm"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2.5 py-1 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                Reset Dates
              </button>
            )}
            <span className="text-[11px] text-surface-400 dark:text-surface-500 ml-auto">
              Filtered by prompt publication date
            </span>
          </div>
        )}

        {/* Active timeframe indicator info badge */}
        <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500" />
            <span>
              Showing metrics for: <strong className="text-surface-800 dark:text-surface-200 font-semibold">{activeTimeframeLabel}</strong>
            </span>
          </div>
          <span className="font-mono text-[11px]">
            {metrics.count} {metrics.count === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600/80 dark:text-sky-400/80 bg-sky-500/10 px-2 py-0.5 rounded-full">
              Reads
            </span>
          </div>
          <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight">
            {metrics.totalViews.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400">Total Views</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-full">
              Likes
            </span>
          </div>
          <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight">
            {metrics.totalLikes.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400">Total Likes</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <Bookmark className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Saves
            </span>
          </div>
          <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight">
            {metrics.totalSaves.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400">Total Saves</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600/80 dark:text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Average
            </span>
          </div>
          <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight">
            {metrics.avgViews.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400">Avg Views / Prompt</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Ratio
            </span>
          </div>
          <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight">
            {metrics.engagementRate}%
          </p>
          <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400">Engagement Rate</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center justify-between text-primary-600 dark:text-primary-400 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider text-primary-600/80 dark:text-primary-400/80 bg-primary-500/10 px-2 py-0.5 rounded-full">
              #1 Top
            </span>
          </div>
          <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight truncate" title={metrics.topPost?.title || 'None'}>
            {metrics.topPost ? (metrics.topPost.views || 0).toLocaleString() : '0'}
          </p>
          <p className="mt-1 text-xs font-medium text-surface-500 dark:text-surface-400 truncate" title={metrics.topPost?.title || 'None'}>
            {metrics.topPost ? metrics.topPost.title : 'No prompts'}
          </p>
        </div>
      </div>

      {/* Side-by-side Breakdowns (AI Tools & Categories) */}
      {(activeView === 'all' || activeView === 'breakdowns') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Views by AI Tool */}
          <div className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-surface-950 dark:text-white">Views by AI Tool</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Distribution of readership by generator</p>
                </div>
              </div>
              <span className="text-xs font-bold text-surface-500">{toolStats.length} tools</span>
            </div>

            <div className="space-y-3">
              {toolStats.slice(0, 6).map((item, idx) => {
                const toolInfo = getToolInfo(item.tool, settings?.toolDetails);
                return (
                  <div key={item.tool} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white dark:bg-surface-800 p-0.5 shadow-2xs border border-black/5 dark:border-white/10">
                          {toolInfo.logo ? (
                            <Image
                              src={toolInfo.logo}
                              alt={item.tool}
                              width={16}
                              height={16}
                              className={`h-full w-full object-contain rounded-full ${
                                item.tool.toLowerCase().includes('chatgpt') || toolInfo.logo.includes('chatgpt')
                                  ? 'dark:invert dark:brightness-200'
                                  : ''
                              }`}
                            />
                          ) : (
                            <Cpu className="w-3 h-3 text-surface-500" />
                          )}
                        </span>
                        <span className="font-bold text-surface-900 dark:text-surface-100 truncate">{item.tool}</span>
                        <span className="text-[11px] text-surface-400 font-normal">({item.count} prompts)</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-surface-900 dark:text-surface-100">{item.views.toLocaleString()} views</span>
                        <span className="text-surface-400 text-[11px] w-12 text-right">({item.percentage}%)</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-primary-500'
                            : idx === 1
                            ? 'bg-sky-500'
                            : idx === 2
                            ? 'bg-emerald-500'
                            : 'bg-indigo-400'
                        }`}
                        style={{ width: `${Math.max(4, Math.min(100, Number(item.percentage)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {toolStats.length === 0 && (
                <p className="text-xs text-surface-500 py-4 text-center">No AI tools recorded yet.</p>
              )}
            </div>
          </div>

          {/* Views by Category */}
          <div className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-surface-950 dark:text-white">Views by Category</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Which genres and styles get the most traffic</p>
                </div>
              </div>
              <span className="text-xs font-bold text-surface-500">{categoryStats.length} categories</span>
            </div>

            <div className="space-y-3">
              {categoryStats.slice(0, 6).map((item, idx) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-surface-900 dark:text-surface-100 capitalize truncate">{item.category}</span>
                      <span className="text-[11px] text-surface-400 font-normal">({item.count} prompts)</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-surface-900 dark:text-surface-100">{item.views.toLocaleString()} views</span>
                      <span className="text-surface-400 text-[11px] w-12 text-right">({item.percentage}%)</span>
                    </div>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-sky-500'
                          : idx === 1
                          ? 'bg-indigo-500'
                          : idx === 2
                          ? 'bg-rose-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(4, Math.min(100, Number(item.percentage)))}%` }}
                    />
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-xs text-surface-500 py-4 text-center">No categories recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Tags Cloud */}
      {(activeView === 'all' || activeView === 'breakdowns') && topTags.length > 0 && (
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-surface-950 dark:text-white">Top Tags by Viewership</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTags.map((item, idx) => (
              <div
                key={item.tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-xs font-semibold text-surface-700 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200"
              >
                <span className="text-surface-400 font-mono text-[10px]">#{idx + 1}</span>
                <span>{item.tag}</span>
                <span className="rounded-full bg-primary-500/10 px-1.5 py-0.2 text-[10px] font-bold text-primary-600 dark:text-primary-400 font-mono">
                  {item.views.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Prompts Leaderboard & Table */}
      {(activeView === 'all' || activeView === 'leaderboard') && (
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-surface-950 dark:text-white">Prompts Leaderboard</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Ranked by readership and engagement. Click any prompt to preview live or edit directly.
              </p>
            </div>
            <span className="text-xs font-bold text-surface-500">
              Showing {displayPosts.length} of {posts.length} prompts
            </span>
          </div>

          {/* Table Filters & Search Bar */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompt title, tag, tool..."
                className={`${adminInputOnCard} pl-9`}
              />
            </div>

            <AdminSelect
              value={sortField}
              onChange={v => setSortField(v as SortField)}
              className={adminInputOnCard}
            >
              <option value="views">Sort by Views (Highest first)</option>
              <option value="likes">Sort by Likes (Highest first)</option>
              <option value="saves">Sort by Saves (Highest first)</option>
              <option value="engagement">Sort by Engagement Rate %</option>
              <option value="newest">Sort by Newest Created</option>
            </AdminSelect>

            <AdminSelect
              value={selectedTool}
              onChange={setSelectedTool}
              className={adminInputOnCard}
            >
              <option value="">All AI Tools</option>
              {availableTools.map(tool => (
                <option key={tool} value={tool}>{tool}</option>
              ))}
            </AdminSelect>

            <AdminSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              className={adminInputOnCard}
            >
              <option value="">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </AdminSelect>
          </div>

          {/* Ranked Table */}
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
            {displayPosts.length === 0 ? (
              <div className="py-12 text-center text-xs text-surface-500">
                No prompts match your current filters.
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                {displayPosts.map((post, index) => {
                  const views = post.views || 0;
                  const likes = post.likes || post.likedBy?.length || 0;
                  const saves = post.bookmarkedBy?.length || 0;
                  const engRate = views > 0 ? (((likes + saves) / views) * 100).toFixed(1) : '0.0';
                  const tools = getAllTools(post);
                  const viewWidthPercent = Math.max(2, Math.min(100, Math.round((views / maxViewsInList) * 100)));

                  return (
                    <div
                      key={post.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-5 hover:bg-white/80 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      {/* Left: Rank + Thumbnail + Title + Meta */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Rank Badge */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black">
                          {index === 0 ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300 ring-1 ring-amber-400/30">
                              🥇
                            </span>
                          ) : index === 1 ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-300/30 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300/50">
                              🥈
                            </span>
                          ) : index === 2 ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-700/20 text-amber-800 dark:text-amber-500 ring-1 ring-amber-700/30">
                              🥉
                            </span>
                          ) : (
                            <span className="text-surface-400 text-[11px]">#{index + 1}</span>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-surface-100 dark:bg-surface-800">
                          {post.thumbnailUrl ? (
                            <Image
                              src={post.thumbnailUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="44px"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-surface-400 text-xs">
                              Prompt
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-xs font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {post.title}
                            </h4>
                            {post.featured && (
                              <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-surface-500 dark:text-surface-400">
                            {post.category && (
                              <span className="font-semibold text-surface-700 dark:text-surface-300 capitalize">
                                {post.category}
                              </span>
                            )}
                            {tools.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{tools.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-10 sm:pl-0">
                        {/* Views Column with Bar */}
                        <div className="w-28 text-right space-y-1">
                          <div className="flex items-center justify-end gap-1.5 font-mono text-xs font-bold text-surface-950 dark:text-white">
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                            <span>{views.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${viewWidthPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Likes & Saves */}
                        <div className="flex items-center gap-3 text-xs font-mono text-surface-600 dark:text-surface-300">
                          <span className="flex items-center gap-1" title="Likes">
                            <Heart className="w-3 h-3 text-rose-500" />
                            {likes}
                          </span>
                          <span className="flex items-center gap-1" title="Saves">
                            <Bookmark className="w-3 h-3 text-emerald-500" />
                            {saves}
                          </span>
                        </div>

                        {/* Engagement Rate Badge */}
                        <span
                          className="rounded-full bg-primary-500/10 px-2.5 py-1 text-[11px] font-bold text-primary-600 dark:text-primary-400 border border-primary-500/20 font-mono"
                          title="Engagement Rate: (Likes + Saves) / Views"
                        >
                          {engRate}%
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/post/${post.slug || post.id}`}
                            target="_blank"
                            className="rounded-lg p-1.5 text-surface-500 hover:bg-black/5 hover:text-surface-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                            title="View live post"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => onEditPost(post)}
                            className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/15 transition-colors"
                            title="Edit prompt"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
