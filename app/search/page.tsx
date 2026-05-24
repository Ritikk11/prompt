export const runtime = 'edge';
import { fetchPosts, fetchSettings } from '@/lib/data';
import SearchClient from './SearchClient';



export default async function SearchPage() {
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  return <SearchClient posts={posts} settings={settings} />;
}
