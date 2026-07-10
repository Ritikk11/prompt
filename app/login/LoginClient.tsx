'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User as UserIcon, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Sparkles, Compass, Shield } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';

function LoginContent({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get('redirectTo') || '/profile';

  // Mode: 'login' | 'signup' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(
    searchParams.get('reset') === 'true' ? 'reset' : 'login'
  );

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-load check: if user already logged in, redirect them (unless this is
  // a password-recovery session, which needs to stay on this page).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mode !== 'reset') {
        router.replace(redirectTo);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        return;
      }
      if (session && mode !== 'reset') {
        router.replace(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, redirectTo, supabase.auth, mode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccessMsg('Password updated successfully! Redirecting...');
      setNewPassword('');
      window.setTimeout(() => router.replace(redirectTo), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback?next=' + encodeURIComponent(redirectTo),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed');
    }
  };

  const validateForm = () => {
    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your display name.');
        return false;
      }
      if (!username.trim()) {
        setErrorMsg('Please enter a username.');
        return false;
      }
      const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
      if (!usernameRegex.test(username)) {
        setErrorMsg('Username must be 3-15 characters and contain only letters, numbers, or underscores.');
        return false;
      }
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }

    if (mode !== 'forgot' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace(redirectTo);
      } else if (mode === 'signup') {
        // Disallow temporary/disposable emails
        const tempEmailDomains = ['tempmail.com', 'mailinator.com', 'yopmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com', 'temp-mail.org', 'dispostable.com', 'getairmail.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        if (tempEmailDomains.includes(domain)) {
          throw new Error('Please use a proper, real email address. Temporary email services are not allowed.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: username.toLowerCase().trim(),
            },
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg('Account created successfully! Please check your email to confirm your verification.');
          // Clear inputs
          setFullName('');
          setUsername('');
          setPassword('');
        } else {
          router.replace(redirectTo);
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?reset=true`,
        });
        if (error) throw error;
        setSuccessMsg('Password reset link sent to your email! Please check your inbox.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4 sm:p-6 lg:p-8">
      {/* Container Box */}
      <div className="w-full max-w-5xl bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] fade-in">
        
        {/* Left Side: Brand Showcase (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-primary-600 to-purple-700 p-8 flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient light blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

          {/* Logo & Header */}
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2.5 text-white">
              <Sparkles className="w-6 h-6 fill-white text-primary-300" />
              <span className="font-black text-xl tracking-tight uppercase">{settings.siteTitle || 'PromptMatrix'}</span>
            </Link>
          </div>

          {/* Body Content */}
          <div className="relative z-10 my-auto text-white space-y-6">
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              Unlock the power of premium AI prompt recipes.
            </h2>
            <p className="text-sm text-primary-100/90 leading-relaxed font-medium">
              Join our community of creators, customize templates instantly, save your favorite prompt workflows, and showcase your finest AI prompt engineering skills.
            </p>

            {/* Micro Feature Icons */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-xs text-primary-100 font-semibold bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <Compass className="w-4 h-4 text-purple-300 shrink-0" />
                <span>Browse thousands of copy-ready prompts</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-primary-100 font-semibold bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <Shield className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Verified creators & fully tested workflows</span>
              </div>
            </div>
          </div>

          {/* Footer of Left Panel */}
          <div className="relative z-10 flex items-center justify-between text-xs text-primary-200">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-white transition-colors font-bold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </Link>
            <span>© {new Date().getFullYear()} {settings.siteTitle}</span>
          </div>
        </div>

        {/* Right Side: Auth Inputs Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center relative">
          
          {/* Mobile brand header (visible only on mobile) */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500 fill-primary-500" />
              <span className="font-black text-lg text-surface-900 dark:text-white uppercase tracking-tight">{settings.siteTitle || 'PromptMatrix'}</span>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Form Title */}
            <div>
              <h1 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Your Profile'}
                {mode === 'forgot' && 'Reset Your Password'}
                {mode === 'reset' && 'Choose a New Password'}
              </h1>
              <p className="text-xs text-surface-500 mt-1.5 font-medium leading-relaxed">
                {mode === 'login' && 'Sign in to access saved prompts, favorites, and comments.'}
                {mode === 'signup' && 'Join the community and share your prompt workflows.'}
                {mode === 'forgot' && "Enter your email address and we'll send you a recovery link."}
                {mode === 'reset' && 'Enter a new password for your account.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 p-3.5 text-xs text-red-600 dark:text-red-400 font-bold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 p-3.5 text-xs text-green-600 dark:text-green-400 font-bold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Reset Password Form */}
            {mode === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none text-sm text-surface-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                >
                  {loading ? 'Updating...' : (<>Update Password <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>
            ) : (
            <>
            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">Display Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none text-sm text-surface-900 dark:text-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">Username (@handle)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary-500">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="johndoe"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none text-sm text-surface-900 dark:text-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none text-sm text-surface-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                        className="text-xs text-primary-500 hover:text-primary-600 font-bold transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none text-sm text-surface-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email domain warnings for sign-up */}
              {mode === 'signup' && (
                <div className="rounded-xl p-3 bg-amber-50/50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                  <p className="font-bold mb-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-500" /> Email Verification Note:
                  </p>
                  <p>Accounts registered using temporary/disposable email addresses are strictly prohibited. Always use your real email address.</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? 'Processing...' : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Password Reset'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* OAuth Separator */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-6 text-center">
                  <hr className="border-surface-200 dark:border-surface-800" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-surface-900 px-3.5 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                    or continue with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors text-surface-700 dark:text-surface-200"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}

            {/* Auth Mode Toggle */}
            <div className="text-center pt-2">
              {mode === 'login' && (
                <p className="text-xs text-surface-500 font-medium">
                  Don&apos;t have an account yet?{' '}
                  <button
                    onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-primary-500 hover:text-primary-600 font-bold transition-colors"
                  >
                    Sign up free
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p className="text-xs text-surface-500 font-medium">
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-primary-500 hover:text-primary-600 font-bold transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-surface-500 hover:text-primary-500 font-bold transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </button>
              )}
            </div>
            </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginClient({ settings }: { settings: SiteSettings }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginContent settings={settings} />
    </Suspense>
  );
}
