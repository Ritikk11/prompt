export const runtime = 'edge';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';
import type { Metadata } from 'next';


export const dynamic = 'force-dynamic';

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
