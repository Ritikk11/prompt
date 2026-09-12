'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw, Home, RefreshCw } from 'lucide-react';

// After a deploy, clients still on the previous build 404 when lazy-loading
// route chunks or RSC payloads (old hashed files are gone), which surfaces as
// ChunkLoadError / failed-fetch client exceptions. A full reload fetches the
// new build and always fixes it, so do that automatically — once per session
// per URL, to avoid a reload loop when the error is a real crash.
function isStaleDeploymentError(error: Error) {
  const text = `${error.name} ${error.message}`;
  return (
    error.name === 'ChunkLoadError' ||
    /loading chunk [\w-]+ failed/i.test(text) ||
    /dynamically imported module/i.test(text)
  );
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    if (!isStaleDeploymentError(error)) return;
    const key = `pmx-reload:${window.location.pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-56px)] w-full items-center justify-center px-4 py-8 sm:px-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.08] sm:p-10">
        {/* Ambient Amber/Rose Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-rose-500/15 blur-3xl" />

        {/* Warning Icon */}
        <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-inner dark:border-rose-400/20 dark:text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <span className="relative z-10 inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-black tracking-widest text-rose-600 uppercase dark:border-rose-400/20 dark:text-rose-300">
          Application Error
        </span>

        <h1 className="relative z-10 mt-3 text-2xl font-black tracking-tight text-surface-950 dark:text-white sm:text-3xl">
          Something went wrong
        </h1>

        <p className="relative z-10 mx-auto mt-2 max-w-sm text-xs leading-relaxed text-surface-600 dark:text-surface-400">
          The page encountered an unexpected problem. This is usually temporary and can be resolved by refreshing.
        </p>

        {error.digest && (
          <div className="relative z-10 mx-auto mt-4 inline-block rounded-xl border border-black/[0.06] bg-black/[0.03] px-3 py-1 text-[11px] font-mono text-surface-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400">
            Error ID: {error.digest}
          </div>
        )}

        {/* Actions */}
        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary-600 px-5 text-xs font-bold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-700 active:scale-95"
          >
            <RotateCw className="h-3.5 w-3.5" /> Refresh Page
          </button>

          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-surface-950 active:scale-95 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:bg-white/[0.14] dark:hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </button>

          <Link
            href="/"
            prefetch={false}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.02] px-4 text-xs font-semibold text-surface-600 transition hover:bg-black/[0.06] hover:text-surface-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
