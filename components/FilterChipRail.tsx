'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
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

export type RailSortOption = { label: string; value: string };

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
  sticky = false,
  gridLimit,
  sortValue,
  sortOptions = [],
  onSortChange,
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
  /** Pin the chip rail below the header: hides on scroll down, slides back on scroll up. */
  sticky?: boolean;
  /** Cap how many posts the grid renders (homepage teaser sections). */
  gridLimit?: number;
  /** Currently selected sort. Renders a sort dropdown at the head of the rail. */
  sortValue?: string;
  sortOptions?: RailSortOption[];
  onSortChange?: (value: string) => void;
  settings?: any;
  cardStyleOverride?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
}) {
  const [active, setActive] = useState<Chip>({ label: 'All', value: 'all', kind: 'all' });
  const [railPinned, setRailPinned] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const railAnchorRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const showSort = sortOptions.length > 0 && Boolean(onSortChange);

  const updateScrollFades = useCallback(() => {
    const el = chipScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = chipScrollRef.current;
    if (!el) return;
    updateScrollFades();
    el.addEventListener('scroll', updateScrollFades, { passive: true });
    const ro = new ResizeObserver(updateScrollFades);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollFades);
      ro.disconnect();
    };
  }, [updateScrollFades, items, tags, tools]);

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sortOpen]);

  useEffect(() => {
    if (!sticky) return;
    lastScrollYRef.current = window.scrollY;
    let frame: number | null = null;

    const update = () => {
      frame = null;
      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;
      // The anchor marks the rail's natural flow position (it never moves with
      // the sticky offset or the hide translate). Hide/reveal only applies once
      // the page has scrolled past it — translating the rail at its natural
      // position would lift it over the content above (hero, sort row).
      const anchorTop = railAnchorRef.current?.getBoundingClientRect().top ?? Infinity;
      const pinned = anchorTop <= 54;
      setRailPinned(pinned);
      if (!pinned) {
        setRailHidden(false);
      } else if (delta > 4) {
        setRailHidden(true);
      } else if (delta < -4) {
        setRailHidden(false);
      }
      lastScrollYRef.current = y;
    };

    const onScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [sticky]);

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

  const selectChip = (chip: Chip) => {
    setActive(chip);
    // Clicking a chip mid-scroll leaves the old scroll offset pointing past the
    // (usually shorter) filtered grid — blank space or footer. Jump back so the
    // rail lands at its pinned spot with the new results right under it.
    if (sticky && railAnchorRef.current) {
      const gridTop = railAnchorRef.current.getBoundingClientRect().top + window.scrollY - 54;
      if (window.scrollY > gridTop) {
        window.scrollTo({ top: gridTop, behavior: 'smooth' });
      }
    }
  };

  const filteredPosts = useMemo(() => {
    let matched = posts;
    if (active.kind === 'tool') matched = posts.filter(post => postMatchesTool(post, active.value));
    else if (active.kind === 'category') matched = posts.filter(post => postMatchesCategory(post, active.value));
    else if (active.kind !== 'all') matched = posts.filter(post => postMatchesTag(post, active.value));
    return gridLimit ? matched.slice(0, gridLimit) : matched;
  }, [active, posts, gridLimit]);

  // 54px = header (h-12, 48px) + the 6px scroll-progress strip below it, so
  // the pinned rail sits flush under both. When hidden it must clear its own
  // height plus that offset to fully leave the viewport. The transition only
  // runs while pinned: on re-entering the natural flow position the rail must
  // snap into place instead of visibly sliding over the content above it.
  const stickyClasses = sticky
    ? ` sticky top-[54px] z-30${railPinned ? ' transition-transform duration-300 ease-in-out' : ''} ${
        railHidden ? '-translate-y-[calc(100%_+_54px)]' : 'translate-y-0'
      }`
    : '';

  const activeSortLabel = sortOptions.find(option => option.value === sortValue)?.label || sortOptions[0]?.label || '';

  return (
    <>
      {sticky && <div ref={railAnchorRef} aria-hidden className="h-0" />}
      {/* Rail: no bounding box — chips scroll edge-to-edge like tensor.art /
          civitai. When sticky the backdrop-blur gives a frosted-glass effect
          against whatever sits behind. */}
      <div className={`-mx-4 mb-6 flex items-center gap-2 px-4 py-2.5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8${stickyClasses}${railPinned ? ' bg-white/80 backdrop-blur-xl dark:bg-surface-950/80' : ''}`}>
        {showSort && (
          <div ref={sortRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen(open => !open)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-surface-200 bg-white px-3 text-[13px] font-medium text-surface-700 transition-all hover:border-surface-300 hover: dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:border-surface-600"
            >
              {activeSortLabel}
              <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              role="listbox"
              className={`absolute left-0 top-full z-50 mt-1 w-36 origin-top-left overflow-hidden rounded-2xl border border-surface-200 bg-white py-1 shadow-xl shadow-surface-900/8 transition-all duration-200 ease-out dark:border-surface-700 dark:bg-surface-900 dark:shadow-black/40 ${
                sortOpen ? 'scale-100 opacity-100 visible' : 'pointer-events-none invisible scale-95 opacity-0'
              }`}
            >
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === sortValue}
                  onClick={() => {
                    onSortChange?.(option.value);
                    setSortOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    option.value === sortValue
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                      : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Divider between sort and chips */}
        {showSort && <div className="h-5 w-px shrink-0 bg-surface-200 dark:bg-surface-700" />}
        <div
          ref={chipScrollRef}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maskImage: canScrollLeft && canScrollRight
              ? 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
              : canScrollRight
                ? 'linear-gradient(to right, black calc(100% - 24px), transparent)'
                : canScrollLeft
                  ? 'linear-gradient(to right, transparent, black 24px)'
                  : undefined,
            WebkitMaskImage: canScrollLeft && canScrollRight
              ? 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
              : canScrollRight
                ? 'linear-gradient(to right, black calc(100% - 24px), transparent)'
                : canScrollLeft
                  ? 'linear-gradient(to right, transparent, black 24px)'
                  : undefined,
          }}
        >
          <div className="flex min-w-max items-center gap-1.5">
          {chips.map(chip => {
            const isActive = active.kind === chip.kind && active.value === chip.value;
            const toolInfo = getToolInfo(chip.value || chip.label, settings?.toolDetails);
            const showToolLogo = Boolean(toolInfo.logo);
            return (
              <button
                key={`${chip.kind}:${chip.value}`}
                type="button"
                onClick={() => selectChip(chip)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-600 text-white dark:bg-primary-500'
                    : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 hover:text-surface-900 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-100'
                }`}
              >
                {showToolLogo ? (
                  <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-white p-[1px]">
                    <Image src={toolInfo.logo} alt={`${chip.label} logo`} width={16} height={16} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </span>
                ) : null}
                {chip.label}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {renderGrid && (
        <>
          <div data-reveal-stagger className={getGridClasses(settings?.features?.mobileColumns, settings?.features?.desktopColumns)}>
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
