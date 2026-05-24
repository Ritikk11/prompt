export const runtime = 'edge';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';


export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <ExploreClient posts={posts} settings={settings} />;
}
