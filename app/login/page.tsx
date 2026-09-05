import { fetchSettings } from '@/lib/data';
import Link from 'next/link';
import { UserX, ArrowLeft } from 'lucide-react';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Sign In | AI PromptMatrix',
  description: 'Sign in or sign up to access your saved prompts, comments, and public creator profile on AI PromptMatrix.',
};

export default async function LoginPage() {
  const settings = await fetchSettings();

  // /login is for public user accounts only.
  // If userProfiles is disabled in admin settings, public accounts are closed.
  if (!settings.features?.userProfiles) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] w-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.08] sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <UserX className="h-7 w-7 opacity-80" />
          </div>
          <h1 className="text-xl font-black text-surface-950 dark:text-white sm:text-2xl">Public Sign In is Disabled</h1>
          <p className="mt-2 text-xs leading-relaxed text-surface-600 dark:text-surface-300">
            User accounts and public registrations have been disabled by the site administrator.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <LoginClient settings={settings} />;
}
