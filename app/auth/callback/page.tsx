'use client';
export const runtime = 'edge';



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

    const finishSuccess = (accessToken?: string, refreshToken?: string) => {
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'OAUTH_AUTH_SUCCESS',
          access_token: accessToken,
          refresh_token: refreshToken
        }, targetOrigin);
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
    
    // The supabase browser client will automatically exchange the code for a session
    // when it detects the code in the URL. We just need to listen for the event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          finishSuccess(session?.access_token, session?.refresh_token);
        }
      }
    );

    // Also check for existing session in case the event fired before we listened
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        finishError(error.message);
      } else if (session) {
        finishSuccess(session.access_token, session.refresh_token);
      }
    });

    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');
    if (errorParam || errorDescription) {
       const msg = errorDescription || errorParam || 'Auth Error';
       finishError(msg);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="text-center max-w-sm">
        {errorMsgs ? (
           <>
            <h1 className="text-xl font-semibold mb-2 text-red-600">Authentication Error</h1>
            <p className="text-sm text-slate-500">{errorMsgs}</p>
           </>
        ) : (
           <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Completing authentication...</h1>
            <p className="text-sm text-slate-500">
              Please wait while we log you in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
