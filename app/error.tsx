'use client';

import { useEffect } from 'react';

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
    /failed to fetch|load failed|networkerror|dynamically imported module/i.test(text)
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-black text-surface-900 dark:text-white">Something went wrong</h2>
      <p className="max-w-md text-sm text-surface-600 dark:text-surface-400">
        The page hit an unexpected error. This usually clears up with a refresh.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
        >
          Refresh page
        </button>
        <button
          onClick={reset}
          className="rounded-xl border border-surface-300 px-6 py-2.5 text-sm font-bold text-surface-700 transition hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
