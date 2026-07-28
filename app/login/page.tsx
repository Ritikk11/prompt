import { fetchSettings } from '@/lib/data';
import Link from 'next/link';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Sign In | AI PromptMatrix',
  description: 'Sign in or sign up to access your saved prompts, comments, and public creator profile on AI PromptMatrix.',
};

export default async function LoginPage() {
  const settings = await fetchSettings();
  if (!settings.features?.userProfiles) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <h1 className="text-2xl font-black text-surface-950 dark:text-white">Sign In is currently disabled</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-surface-600 dark:text-surface-300">
            User accounts have been disabled by the site admin.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-bold text-white hover:bg-primary-600">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }
  
  return <LoginClient settings={settings} />;
}
