import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { notFound } from 'next/navigation';
import ProfileClient from './ProfileClient';



export default async function ProfilePage() {
  const settings = await fetchSettings();
  if (!settings.features?.userProfiles) notFound();

  const posts = await fetchPostSummaries();
  
  return <ProfileClient posts={posts} settings={settings} />;
}
