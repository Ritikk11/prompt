export const runtime = 'edge';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import SearchClient from './SearchClient';



export default async function SearchPage() {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <SearchClient posts={posts} settings={settings} />;
}
