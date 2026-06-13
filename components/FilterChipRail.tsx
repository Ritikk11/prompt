'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/types';
import { getAllTools } from '@/lib/constants';
import PostCard from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';
import { getGridClasses } from '@/lib/utils';

type Chip = {
  label: string;
  value: string;
  kind: 'all' | 'tool' | 'tag';
};

function postMatchesTool(post: Post, tool: string) {
  const target = tool.toLowerCase();
  return getAllTools(post).some(item => item.toLowerCase() === target);
}

function postMatchesTag(post: Post, tag: string) {
  const target = tag.toLowerCase();
  return post.tags?.some(item => item.toLowerCase() === target);
}

export function getFilterTagsFromPosts(posts: Post[], limit = 12) {
  const counts = new Map<string, number>();
  posts.forEach(post => {
    (post.tags || []).forEach(tag => {
      const clean = tag.trim();
      if (!clean) return;
      counts.set(clean, (counts.get(clean) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export default function FilterChipRail({
  posts,
  tools = [],
  tags = [],
  showTools = true,
  showTags = true,
  renderGrid = false,
  settings,
  cardStyleOverride,
}: {
  posts: Post[];
  tools?: string[];
  tags?: string[];
  showTools?: boolean;
  showTags?: boolean;
  renderGrid?: boolean;
  settings?: any;
  cardStyleOverride?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
}) {
  const [active, setActive] = useState<Chip>({ label: 'All', value: 'all', kind: 'all' });

  const chips = useMemo(() => {
    const list: Chip[] = [{ label: 'All', value: 'all', kind: 'all' }];
    const seenLabels = new Set(['all']);
    if (showTools) {
      tools.filter(Boolean).forEach(tool => {
        const key = tool.toLowerCase();
        if (seenLabels.has(key)) return;
        seenLabels.add(key);
        list.push({ label: tool, value: tool, kind: 'tool' });
      });
    }
    if (showTags) {
      tags.filter(Boolean).forEach(tag => {
        const key = tag.toLowerCase();
        if (seenLabels.has(key)) return;
        seenLabels.add(key);
        list.push({ label: tag, value: tag, kind: 'tag' });
      });
    }
    return list;
  }, [showTags, showTools, tags, tools]);

  const filteredPosts = useMemo(() => {
    if (active.kind === 'all') return posts;
    if (active.kind === 'tool') return posts.filter(post => postMatchesTool(post, active.value));
    return posts.filter(post => postMatchesTag(post, active.value));
  }, [active, posts]);

  return (
    <>
      <div className="-mx-1 mb-6 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-2 px-1">
          {chips.map(chip => {
            const isActive = active.kind === chip.kind && active.value === chip.value;
            return (
              <button
                key={`${chip.kind}:${chip.value}`}
                type="button"
                onClick={() => setActive(chip)}
                className={`rounded-xl px-3.5 py-2 text-xs font-black transition-colors ${
                  isActive
                    ? 'bg-white text-surface-950 shadow-sm dark:bg-white dark:text-surface-950'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-white dark:hover:bg-surface-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {renderGrid && (
        <>
          <div className={getGridClasses(settings?.features?.mobileColumns, settings?.features?.desktopColumns)}>
            {filteredPosts.map((post, i) => (
              <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
                <PostCard post={post} index={i} cardStyleOverride={cardStyleOverride} />
                <AdSlot placement="inFeed" inFeedIndex={i} className="mt-1 bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
              </div>
            ))}
          </div>
          {filteredPosts.length === 0 && (
            <div className="py-14 text-center">
              <p className="text-sm font-semibold text-surface-400">No prompts found for this selection.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
