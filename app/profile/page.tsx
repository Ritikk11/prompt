import { fetchPosts, fetchSettings } from '@/lib/data';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  return <ProfileClient posts={posts} settings={settings} />;
}
