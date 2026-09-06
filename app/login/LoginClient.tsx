'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User as UserIcon, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function LoginContent({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get('redirectTo') || '/profile';

  // Mode: 'login' | 'signup' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(
    searchParams.get('reset') === 'true' ? 'reset' : 'login'
  );

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto redirect if already authenticated (unless in password recovery)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mode !== 'reset') {
        router.replace(redirectTo);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed');
    }
  };

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
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username.trim())) {
        setErrorMsg('Username must be 3-20 characters using letters, numbers, or underscores.');
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
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.replace(redirectTo);
      } else if (mode === 'signup') {
        const tempEmailDomains = [
          'tempmail.com',
          'mailinator.com',
          'yopmail.com',
          '10minutemail.com',
          'guerrillamail.com',
          'sharklasers.com',
          'temp-mail.org',
          'dispostable.com',
          'getairmail.com',
        ];
        const domain = email.split('@')[1]?.toLowerCase();
        if (tempEmailDomains.includes(domain)) {
          throw new Error('Please use a personal email address. Disposable emails are not permitted.');
        }

        const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: cleanUsername,
            },
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg('Account created! Please check your email to confirm your address.');
          setFullName('');
          setUsername('');
          setPassword('');
        } else {
          router.replace(redirectTo);
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login?reset=true`,
        });
        if (error) throw error;
        setSuccessMsg('Reset link sent! Please check your email inbox.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] w-full items-center justify-center px-4 py-8 sm:px-6">
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.08] sm:p-8">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary-500/15 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 transition hover:opacity-80">
            <span className="relative block h-8 w-8 overflow-hidden rounded-xl shadow-sm">
              <Image
                src={settings.siteLogo || '/icon-190x190.jpg'}
                alt=""
                fill
                sizes="32px"
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </span>
            <span className="text-lg font-black tracking-tight text-surface-950 dark:text-white">
              {settings.siteTitle || 'PromptMatrix'}
            </span>
          </Link>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-surface-950 dark:text-white">
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set new password'}
          </h1>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {mode === 'login' && 'Sign in to access your prompts, saves, and profile'}
            {mode === 'signup' && 'Join the community of AI prompt creators'}
            {mode === 'forgot' && "Enter your email to receive a password reset link"}
            {mode === 'reset' && 'Choose a secure password for your account'}
          </p>
        </div>

        {/* Mode Segmented Switcher (for Login vs Signup) */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="relative z-10 mb-6 flex rounded-full border border-white/80 bg-black/[0.04] p-1 dark:border-white/10 dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-surface-950 shadow-sm dark:bg-white/20 dark:text-white'
                  : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-surface-950 shadow-sm dark:bg-white/20 dark:text-white'
                  : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="relative z-10 mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="relative z-10 mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Reset Password Form */}
        {mode === 'reset' ? (
          <form onSubmit={handleResetPassword} className="relative z-10 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/80 bg-white/60 py-2.5 pl-10 pr-10 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-500 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="relative z-10 space-y-5">
            {/* Google 1-Click Auth (Only on login or signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/80 bg-white/80 py-2.5 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-md transition hover:border-white hover:bg-white hover:text-surface-950 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:bg-white/[0.14] dark:hover:text-white"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Continue with Google
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-black/[0.08] dark:border-white/[0.08]" />
                  <span className="absolute bg-white/90 px-3 text-[10px] font-bold uppercase tracking-widest text-surface-400 dark:bg-surface-950/90 dark:text-surface-400">
                    or with email
                  </span>
                </div>
              </>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  {/* Display Name */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">
                      Display Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full rounded-2xl border border-white/80 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Public Username */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">
                      Public Handle (@username)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary-500">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="alexmorgan"
                        className="w-full rounded-2xl border border-white/80 bg-white/60 py-2.5 pl-9 pr-4 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-white/80 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
              </div>

              {/* Password (not needed for forgot mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-bold text-surface-700 dark:text-surface-300">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/80 bg-white/60 py-2.5 pl-10 pr-10 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-500 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  'Please wait...'
                ) : mode === 'login' ? (
                  'Sign In'
                ) : mode === 'signup' ? (
                  'Create Account'
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Back to sign in link for forgot mode */}
            {mode === 'forgot' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* Subtle Footer Link */}
        <div className="relative z-10 mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginClient({ settings }: { settings: SiteSettings }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <LoginContent settings={settings} />
    </Suspense>
  );
}
