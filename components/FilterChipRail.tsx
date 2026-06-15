'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { FilterRailItem, Post } from '@/lib/types';
import { getAllTools, getToolInfo } from '@/lib/constants';
import PostCard from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';
import { getGridClasses } from '@/lib/utils';

type Chip = {
  label: string;
  value: string;
  kind: 'all' | 'tool' | 'tag' | 'category';
};

function postMatchesTool(post: Post, tool: string) {
  const target = tool.toLowerCase();
  return getAllTools(post).some(item => item.toLowerCase() === target);
}

function postMatchesTag(post: Post, tag: string) {
  const target = tag.toLowerCase();
  return post.tags?.some(item => item.toLowerCase() === target);
}

function postMatchesCategory(post: Post, category: string) {
  const target = category.toLowerCase();
  return [post.category, ...(post.categories || [])].filter(Boolean).some(item => item!.toLowerCase() === target);
}

export default function FilterChipRail({
  posts,
  tools = [],
  tags = [],
  items = [],
  showTools = true,
  showTags = true,
  renderGrid = false,
  settings,
  cardStyleOverride,
}: {
  posts: Post[];
  tools?: string[];
  tags?: string[];
  items?: FilterRailItem[];
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
    if (items.length > 0) {
      items.filter(item => item.label && item.value).forEach(item => {
        const key = `${item.type}:${item.value}`.toLowerCase();
        if (seenLabels.has(key)) return;
        seenLabels.add(key);
        list.push({ label: item.label, value: item.value, kind: item.type });
      });
      return list;
    }
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
  }, [items, showTags, showTools, tags, tools]);

  const filteredPosts = useMemo(() => {
    if (active.kind === 'all') return posts;
    if (active.kind === 'tool') return posts.filter(post => postMatchesTool(post, active.value));
    if (active.kind === 'category') return posts.filter(post => postMatchesCategory(post, active.value));
    return posts.filter(post => postMatchesTag(post, active.value));
  }, [active, posts]);

  return (
    <>
      <div className="-mx-2 mb-7 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-3">
          {chips.map(chip => {
            const isActive = active.kind === chip.kind && active.value === chip.value;
            const toolInfo = getToolInfo(chip.value || chip.label, settings?.toolDetails);
            const showToolLogo = Boolean(toolInfo.logo);
            return (
              <button
                key={`${chip.kind}:${chip.value}`}
                type="button"
                onClick={() => setActive(chip)}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-none ring-0 dark:bg-primary-500'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700'
                }`}
              >
                {showToolLogo ? (
                  <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-white p-[2px] shadow-sm">
                    <Image src={toolInfo.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" sizes="20px" />
                  </span>
                ) : null}
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
