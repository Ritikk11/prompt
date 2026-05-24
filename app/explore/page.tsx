export const runtime = 'edge';
import { fetchPosts, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';


export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  return <ExploreClient posts={posts} settings={settings} />;
}
