import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';
import type { Metadata } from 'next';


// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const title = discovery.exploreSeoTitle || discovery.exploreTitle || 'Explore AI Image Prompts | AI PromptMatrix';
  const description = discovery.exploreSeoDescription || discovery.exploreDescription || settings.seoSettings?.defaultMetaDescription || settings.siteDescription;

  return {
    title,
    description,
    openGraph: discovery.exploreOgImage ? {
      title,
      description,
      images: [{ url: discovery.exploreOgImage }],
    } : undefined,
  };
}

export default async function ExplorePage() {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <ExploreClient posts={posts} settings={settings} />;
}
