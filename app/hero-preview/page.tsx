import type { Metadata } from 'next';
import { fetchSections, fetchSettings, fetchPostSummaries } from '@/lib/data';
import HeroPreviewClient from './HeroPreviewClient';

export const metadata: Metadata = {
  title: 'Homepage Hero Preview Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HeroPreviewPage() {
  const [settings, allPosts] = await Promise.all([
    fetchSettings(),
    fetchPostSummaries(),
  ]);

  const featuredPosts = allPosts.filter(
    p => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private'
  );

  return (
    <HeroPreviewClient
      featuredPosts={featuredPosts}
      settings={settings}
      postCount={allPosts.length}
    />
  );
}
