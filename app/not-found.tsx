import Link from 'next/link';
import { Search, Home, Compass, FileQuestion } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | AI PromptMatrix',
  description: "The page you are looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] w-full items-center justify-center px-4 py-8 sm:px-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.08] sm:p-10">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl" />

        {/* Icon & 404 Badge */}
        <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 text-primary-600 shadow-inner dark:border-primary-400/20 dark:text-primary-400">
          <FileQuestion className="h-8 w-8" />
        </div>

        <span className="relative z-10 inline-flex items-center rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-black tracking-widest text-primary-600 uppercase dark:border-primary-400/20 dark:text-primary-300">
          Error 404
        </span>

        <h1 className="relative z-10 mt-3 text-3xl font-black tracking-tight text-surface-950 dark:text-white sm:text-4xl">
          Page Not Found
        </h1>

        <p className="relative z-10 mx-auto mt-2 max-w-sm text-xs leading-relaxed text-surface-600 dark:text-surface-400">
          The page you are looking for doesn&apos;t exist, has been removed, or the link may be outdated.
        </p>

        {/* Search Bar */}
        <form action="/search" className="relative z-10 mx-auto mt-6 w-full max-w-sm">
          <div className="relative">
            <input
              type="text"
              name="q"
              placeholder="Search prompts, models, keywords..."
              className="w-full rounded-2xl border border-white/80 bg-white/60 py-2.5 pl-4 pr-11 text-xs text-surface-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:bg-white/[0.1]"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 active:scale-95"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/explore"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary-600 px-5 text-xs font-bold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-700 active:scale-95"
          >
            <Compass className="h-3.5 w-3.5" /> Explore Prompts
          </Link>

          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-surface-950 active:scale-95 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:bg-white/[0.14] dark:hover:text-white"
          >
            <Home className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
