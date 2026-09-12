import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import Link from 'next/link';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const settings = await fetchSettings();
  if (!settings.features?.userProfiles) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-white/80 bg-white/60 p-8 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150">
          <h1 className="text-2xl font-black text-surface-950 dark:text-white">User Profiles are currently disabled</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-surface-600 dark:text-surface-300">
            The profile and login features have been disabled by the site admin.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" prefetch={false} className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-bold text-white hover:bg-primary-600">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const posts = await fetchPostSummaries();
  
  return <ProfileClient posts={posts} settings={settings} />;
}
