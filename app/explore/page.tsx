import { fetchPosts, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';

export const runtime = 'edge';
export const revalidate = 3600;

export default async function ExplorePage() {
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  return <ExploreClient posts={posts} settings={settings} />;
}
