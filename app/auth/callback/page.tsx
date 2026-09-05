'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { getSafeNextPath } from '@/lib/auth-redirect';

export default function AuthCallbackPage() {
  const [errorMsgs, setErrorMsgs] = useState('');

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const nextPath = getSafeNextPath(params.get('next'));
    const targetOrigin = window.location.origin;

    const ensureProfileData = async (user: any) => {
      if (user && !user.user_metadata?.username) {
        const rawPrefix = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'creator';
        const fallbackUsername = rawPrefix.slice(0, 18) || `user_${Math.random().toString(36).slice(2, 7)}`;
        const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || rawPrefix;
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

        try {
          await supabase.auth.updateUser({
            data: {
              username: fallbackUsername,
              full_name: fallbackName,
              avatar_url: avatar,
            },
          });
        } catch {
          // Non-critical, continue redirect
        }
      }
    };

    const finishSuccess = async (session: any) => {
      if (session?.user) {
        await ensureProfileData(session.user);
      }
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'OAUTH_AUTH_SUCCESS',
            access_token: session?.access_token,
            refresh_token: session?.refresh_token,
          },
          targetOrigin
        );
        window.close();
      } else {
        window.location.href = nextPath;
      }
    };

    const finishError = (msg: string) => {
      setErrorMsgs(msg);
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: msg }, targetOrigin);
        window.close();
      }
    };

    // Listen for auth state change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await finishSuccess(session);
      }
    });

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        finishError(error.message);
      } else if (session) {
        await finishSuccess(session);
      }
    });

    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');
    if (errorParam || errorDescription) {
      const msg = errorDescription || errorParam || 'Authentication Error';
      finishError(msg);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.08] sm:p-8">
        {errorMsgs ? (
          <>
            <h1 className="mb-2 text-lg font-bold text-rose-600 dark:text-rose-400">Authentication Error</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">{errorMsgs}</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <h1 className="text-base font-bold text-surface-900 dark:text-white">Completing sign in...</h1>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Please wait while we set up your profile.</p>
          </>
        )}
      </div>
    </div>
  );
}
