'use client';
export const runtime = 'edge';



import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { getAuthRedirectTo } from '@/lib/auth-redirect';

export default function LoginPopup() {
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    const startOAuth = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getAuthRedirectTo('/admin'),
          },
        });
        if (error) {
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: error.message }, window.location.origin);
          }
        }
      } catch (err: any) {
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: err.message || 'OAuth initialization failed' }, window.location.origin);
        }
      }
    };

    startOAuth();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Connecting to Google</h1>
        <p className="text-sm text-slate-500">
          Please complete the authentication in the Google window that opens...
        </p>
      </div>
    </div>
  );
}
