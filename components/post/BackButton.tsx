'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { markBackNavigation } from '@/components/NavigationTransitionHandler';

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

export default function BackButton({
  fallbackHref = '/explore',
  className = '',
}: BackButtonProps) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent rapid double-clicks from jumping multiple history steps
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);

    if (typeof window !== 'undefined') {
      // Mark back navigation BEFORE router.back() so the dead zone is active
      // immediately, catching ghost taps that fire before the async popstate.
      markBackNavigation();

      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-surface-600 shadow-sm backdrop-blur-xl transition-all hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-primary-400 dark:hover:text-primary-400 cursor-pointer select-none shrink-0 active:scale-95 ${className}`}
      title="Go back to previous page"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>Back</span>
    </button>
  );
}
