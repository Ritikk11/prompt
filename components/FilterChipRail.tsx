'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDownUp, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FilterRailItem, Post } from '@/lib/types';
import { getAllTools, getToolInfo } from '@/lib/constants';
import PostCard from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';
import MasonryGrid from '@/components/MasonryGrid';
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
  disableGridPriority = false,
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
  /** Keep below-the-fold grids from marking their first images as high priority. */
  disableGridPriority?: boolean;
  /** Pin the chip rail below the header: hides on scroll down, slides back on scroll up. */
  sticky?: boolean;
  /** Cap how many posts the grid renders (homepage teaser sections). */
  gridLimit?: number;
  /** Currently selected sort. Renders a sort dropdown at the head of the rail. */
  sortValue?: string;
  sortOptions?: RailSortOption[];
  onSortChange?: (value: string) => void;
  settings?: any;
  cardStyleOverride?: 'v1' | 'v2';
}) {
  const [active, setActive] = useState<Chip>({ label: 'All', value: 'all', kind: 'all' });
  const [railPinned, setRailPinned] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const railAnchorRef = useRef<HTMLDivElement>(null);
  const railBackdropRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const showSort = sortOptions.length > 0 && Boolean(onSortChange);

  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

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

    // Mouse wheel horizontal scrolling on desktop/laptop
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0) {
        const canScroll =
          (e.deltaY > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) ||
          (e.deltaY < 0 && el.scrollLeft > 1);
        if (canScroll) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    // Desktop mouse click-and-drag to slide chips
    const onMouseDown = (e: MouseEvent) => {
      // Only main mouse button
      if (e.button !== 0) return;
      isMouseDownRef.current = true;
      hasMovedRef.current = false;
      startXRef.current = e.pageX;
      scrollStartLeftRef.current = el.scrollLeft;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const dx = e.pageX - startXRef.current;
      if (Math.abs(dx) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = scrollStartLeftRef.current - dx;
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('scroll', updateScrollFades);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
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
      const pinned = anchorTop <= 58;
      setRailPinned(pinned);
      if (railBackdropRef.current) {
        if (pinned) {
          railBackdropRef.current.classList.remove('hidden');
          railBackdropRef.current.classList.add('glass-bar');
        } else {
          railBackdropRef.current.classList.add('hidden');
          railBackdropRef.current.classList.remove('glass-bar');
        }
      }
      if (!pinned) {
        setRailHidden(false);
      } else if (delta > 4) {
        setRailHidden(true);
        if (sortOpen) setSortOpen(false);
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

  const selectChip = (chip: Chip, targetEl?: HTMLElement) => {
    // If the user was dragging the rail on desktop, don't trigger selection
    if (hasMovedRef.current) return;

    setActive(chip);

    // Smoothly center the clicked chip in the horizontal scroll rail so
    // the previous and next chips both become visible.
    const container = chipScrollRef.current;
    if (container && targetEl) {
      const containerRect = container.getBoundingClientRect();
      const chipRect = targetEl.getBoundingClientRect();
      const chipCenter = chipRect.left + chipRect.width / 2;
      const containerCenter = containerRect.left + containerRect.width / 2;
      const targetScrollLeft = container.scrollLeft + (chipCenter - containerCenter);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }

    // Clicking a chip mid-scroll leaves the old scroll offset pointing past the
    // (usually shorter) filtered grid — blank space or footer. Jump back so the
    // rail lands at its pinned spot with the new results right under it.
    if (sticky && railAnchorRef.current) {
      const gridTop = railAnchorRef.current.getBoundingClientRect().top + window.scrollY - 56;
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

  const slideRail = (dir: 'left' | 'right') => {
    const el = chipScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -260 : 260,
      behavior: 'smooth',
    });
  };

  // 56px = header (h-14, 56px) so the pinned rail sits flush under it.
  // When hidden it clears its height + offset.
  const stickyClasses = sticky
    ? ` sticky top-[56px] z-30${railPinned ? ' transition-transform duration-300 ease-in-out' : ''} ${
        railHidden ? '-translate-y-[calc(100%_+_56px)]' : 'translate-y-0'
      }`
    : '';

  const activeSortLabel = sortOptions.find(option => option.value === sortValue)?.label || sortOptions[0]?.label || '';

  return (
    <>
      {sticky && <div ref={railAnchorRef} aria-hidden className="h-0" />}
      {/* Rail: no bounding box — chips scroll edge-to-edge.
          The pinned frosted-glass backdrop is decoupled as an independent layer
          without `isolate` so child dropdowns and chips never suffer from backdrop-root
          cancellation in Chromium/WebKit. */}
      <div className={`relative -mx-4 mb-6 flex items-center gap-2.5 px-4 py-2.5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8${stickyClasses}`}>
        {/* Pinned rail frosted glass backdrop — instant paint with zero delay */}
        {sticky && (
          <div
            ref={railBackdropRef}
            aria-hidden
            className={`pointer-events-none absolute inset-0 z-0 transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] ${
              railPinned ? 'glass-bar' : 'hidden'
            }`}
          />
        )}

        {showSort && (
          <div ref={sortRef} className="relative z-10 shrink-0">
            {/* Trigger — pill with the sort glyph; stays as natural neutral frosted glass */}
            <button
              type="button"
              onClick={() => setSortOpen(open => !open)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold backdrop-blur-xl backdrop-saturate-150 transition-colors duration-150 ${
                sortOpen
                  ? 'border-white/90 bg-white/80 text-surface-900 dark:border-white/20 dark:bg-white/[0.14] dark:text-white'
                  : 'border-white/80 bg-white/60 text-surface-700 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
              }`}
            >
              <ArrowDownUp className="h-3.5 w-3.5 opacity-60" />
              {activeSortLabel}
              <ChevronDown
                className={`h-3.5 w-3.5 opacity-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${sortOpen ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>

            {/* Panel — anchored flush to the pill's left edge.
                High-density frosted fill (bg-white/92, dark:bg-[#0c1024]/92) ensures
                the background NEVER flashes as clear transparent glass, with backdrop-blur-xl
                diffusing colors behind it seamlessly. */}
            <div
              className={`absolute left-0 top-full z-50 mt-1.5 w-48 origin-top-left transform-gpu [backface-visibility:hidden] transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                sortOpen
                  ? 'visible translate-y-0 scale-100 opacity-100'
                  : 'pointer-events-none invisible -translate-y-1.5 scale-[0.94] opacity-0'
              }`}
            >
              <div
                role="listbox"
                className="overflow-hidden rounded-2xl border border-white/80 bg-white/92 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.22)] backdrop-blur-xl backdrop-saturate-150 transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] dark:border-white/12 dark:bg-[#0c1024]/92 dark:backdrop-blur-xl dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)]"
              >
                <div className="border-b border-black/[0.06] px-4 pb-1.5 pt-2 text-[10px] font-black uppercase tracking-widest text-surface-400 dark:border-white/[0.08] dark:text-surface-500">
                  Sort by
                </div>
                <div className="p-1 pt-1.5">
                  {sortOptions.map(option => {
                    const selected = option.value === sortValue;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onSortChange?.(option.value);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                          selected
                            ? 'bg-primary-500/10 text-primary-600 font-semibold dark:bg-primary-400/15 dark:text-primary-300'
                            : 'text-surface-700 hover:bg-black/[0.04] hover:text-surface-900 dark:text-surface-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
                        }`}
                      >
                        {option.label}
                        <Check
                          className={`h-3.5 w-3.5 transition-all duration-200 ${selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                          strokeWidth={3}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider between sort and chips */}
        {showSort && <div className="h-5 w-px shrink-0 bg-black/10 dark:bg-white/15" />}

        {/* Chips scroll rail with desktop chevrons & drag support */}
        <div className="relative min-w-0 flex-1">
          {/* Left chevron on desktop */}
          {canScrollLeft && (
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => slideRail('left')}
              className="absolute -left-2 top-1/2 z-20 hidden -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/90 text-surface-700 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-white hover:text-surface-950 active:scale-95 dark:border-white/12 dark:bg-[#0c1024]/90 dark:text-surface-200 dark:hover:bg-[#0c1024] dark:hover:text-white sm:flex"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            ref={chipScrollRef}
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
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
                  data-active={isActive}
                  onClick={e => selectChip(chip, e.currentTarget)}
                  className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                    isActive
                      ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500'
                      : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
                  }`}
                >
                  {showToolLogo ? (
                    <span className={`relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-white p-[1px] ${isActive ? 'ring-1 ring-white/40' : ''}`}>
                      <Image src={toolInfo.logo} alt={`${chip.label} logo`} width={16} height={16} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </span>
                  ) : null}
                  {chip.label}
                </button>
              );
            })}
            </div>
          </div>

          {/* Right chevron on desktop */}
          {canScrollRight && (
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => slideRail('right')}
              className="absolute -right-2 top-1/2 z-20 hidden -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/90 text-surface-700 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-white hover:text-surface-950 active:scale-95 dark:border-white/12 dark:bg-[#0c1024]/90 dark:text-surface-200 dark:hover:bg-[#0c1024] dark:hover:text-white sm:flex"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {renderGrid && (
        <>
          <MasonryGrid
            posts={filteredPosts}
            settings={settings}
            cardStyleOverride={cardStyleOverride}
            disablePriority={disableGridPriority}
          />
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
