'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { User } from '@supabase/supabase-js';
import type { LightboxState } from './PostLightboxModal';

const PostLightboxModal = dynamic(() => import('./PostLightboxModal'), { ssr: false });

export interface PostPageContextType {
  user: User | null;
  handleLogin: () => void;
  showFeedback: (msg: string, durationMs?: number) => void;
  openLightbox: (images: string[], initialIndex: number, promptIndex: number, tools: string[]) => void;
}

const PostPageContext = createContext<PostPageContextType | null>(null);

export function usePostPage() {
  const ctx = useContext(PostPageContext);
  if (!ctx) {
    throw new Error('usePostPage must be used within a PostPageProvider');
  }
  return ctx;
}

export interface PostPageProviderProps {
  children: ReactNode;
  userProfilesEnabled?: boolean;
  postTitle: string;
  postId: string;
  settings?: any;
}

export default function PostPageProvider({
  children,
  userProfilesEnabled = true,
  postTitle,
  postId,
  settings,
}: PostPageProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState('');
  const [lightboxState, setLightboxState] = useState<LightboxState | null>(null);

  const feedbackTimerRef = useRef<number | null>(null);

  // Public prompt browsing runs with zero auth overhead.

  const handleLogin = useCallback(() => {
    router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const showFeedback = useCallback((msg: string, durationMs = 2500) => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback('');
      feedbackTimerRef.current = null;
    }, durationMs);
  }, []);

  const openLightbox = useCallback(
    (images: string[], initialIndex: number, promptIndex: number, tools: string[]) => {
      setLightboxState({
        images,
        activeImageIndex: initialIndex,
        promptIndex,
        tools,
      });
    },
    []
  );

  const closeLightbox = useCallback(() => {
    setLightboxState(null);
  }, []);

  return (
    <PostPageContext.Provider
      value={{
        user,
        handleLogin,
        showFeedback,
        openLightbox,
      }}
    >
      {children}

      {/* Single floating bottom toast slot for share & try actions */}
      {feedback && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-surface-800 shadow-xl dark:border-white/10 dark:bg-white/[0.08] dark:text-white backdrop-blur-xl backdrop-saturate-150">
          {feedback}
        </div>
      )}

      {/* Dynamic on-demand lightbox modal */}
      {lightboxState && (
        <PostLightboxModal
          state={lightboxState}
          postTitle={postTitle}
          postId={postId}
          settings={settings}
          onClose={closeLightbox}
          onNavigate={(newIdx) =>
            setLightboxState((prev) => (prev ? { ...prev, activeImageIndex: newIdx } : null))
          }
        />
      )}
    </PostPageContext.Provider>
  );
}
