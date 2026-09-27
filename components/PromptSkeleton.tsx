import { ChevronRight } from 'lucide-react';

export default function PromptSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-1 py-4 sm:py-6" role="status" aria-label="Loading prompt page">
      {/* Top row: Pure Skeleton Breadcrumbs & Back button pill */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <nav
          aria-label="Loading breadcrumb navigation"
          className="flex items-center gap-2 text-sm text-surface-500 min-w-0 overflow-x-auto no-scrollbar"
        >
          {/* Home placeholder pill */}
          <div className="h-3.5 w-12 rounded-full bg-black/10 dark:bg-white/15 animate-pulse shrink-0" />
          <ChevronRight className="w-3.5 h-3.5 opacity-30 text-surface-400 shrink-0" />

          {/* Prompts placeholder pill */}
          <div className="h-3.5 w-16 rounded-full bg-black/10 dark:bg-white/15 animate-pulse shrink-0" />
          <ChevronRight className="w-3.5 h-3.5 opacity-30 text-surface-400 shrink-0" />

          {/* Title placeholder pill */}
          <div className="h-3.5 w-28 sm:w-44 rounded-full bg-black/10 dark:bg-white/15 animate-pulse shrink-0" />
        </nav>

        {/* Back Button placeholder pill */}
        <div className="h-7 w-16 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.05] dark:bg-white/[0.08] animate-pulse shrink-0" />
      </div>

      {/* Hero Card Skeleton with Nebula Glows */}
      <div className="relative mb-10 w-full overflow-hidden rounded-[32px] border border-white/20 dark:border-white/10 bg-[#070a14]/90 p-5 sm:p-8 lg:p-12 shadow-2xl text-white backdrop-blur-2xl">
        {/* Ambient Aurora Glows */}
        <div className="pointer-events-none absolute -top-28 left-1/4 w-[450px] h-[450px] rounded-full blur-[80px] opacity-45 bg-primary-500/30 animate-pulse" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 w-[450px] h-[450px] rounded-full blur-[80px] opacity-40 bg-purple-600/25 animate-pulse" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center text-center lg:text-left gap-7 lg:gap-14">
          {/* Artwork Card with Clean, Perfectly Centered Single-Ring Spinner */}
          <div className="relative shrink-0 w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[420px] mx-auto lg:mx-0 rounded-[28px] overflow-hidden border border-white/20 shadow-2xl aspect-[3/4] bg-white/[0.04] backdrop-blur-md flex flex-col items-center justify-center">
            {/* Ambient shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-white/[0.06] to-transparent animate-pulse" />

            {/* Spinner and label with clear vertical margin — zero overlap */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
              <div className="h-11 w-11 rounded-full border-[2.5px] border-white/20 border-t-primary-500 animate-spin mb-4" />
              <span className="text-xs font-semibold text-white/75 tracking-wider select-none">
                Loading prompt...
              </span>
            </div>
          </div>

          {/* Info Side Skeleton */}
          <div className="flex flex-1 flex-col min-w-0 items-center lg:items-start w-full">
            {/* Tool Badges placeholder */}
            <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
              <div className="h-7 w-24 rounded-lg bg-white/10 border border-white/10 animate-pulse" />
              <div className="h-7 w-20 rounded-lg bg-white/10 border border-white/10 animate-pulse" />
            </div>

            {/* Title Skeleton */}
            <div className="w-full flex flex-col items-center lg:items-start gap-3 mb-4">
              <div className="h-8 sm:h-10 w-full max-w-md rounded-xl bg-white/15 animate-pulse" />
              <div className="h-8 sm:h-10 w-3/4 max-w-sm rounded-xl bg-white/15 animate-pulse" />
            </div>

            {/* Author Skeleton */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-white/15 animate-pulse" />
              <div className="h-4 w-28 rounded-md bg-white/10 animate-pulse" />
            </div>

            {/* Action Buttons Row Skeleton (Like, Save, Share) */}
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <div className="h-10 w-24 rounded-full bg-white/10 border border-white/10 animate-pulse" />
              <div className="h-10 w-24 rounded-full bg-white/10 border border-white/10 animate-pulse" />
              <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Below Hero: Prompt Box Skeleton */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded-lg bg-black/[0.10] dark:bg-white/15 animate-pulse" />
          <div className="h-8 w-24 rounded-full bg-primary-500/20 border border-primary-500/30 animate-pulse" />
        </div>
        <div className="space-y-2.5 pt-2">
          <div className="h-4 w-full rounded bg-black/[0.08] dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-11/12 rounded bg-black/[0.08] dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-black/[0.08] dark:bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
