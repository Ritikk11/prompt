import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Determine site URL dynamically or hardcode for now
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptgallery.com';

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    const posts = snapshot.docs.map(doc => doc.data() as Post);

    // Add unique posts
    const publishedPosts = posts.filter(p => p.status === 'published' || !p.status);
    publishedPosts.forEach(post => {
      sitemapEntries.push({
        url: `${baseUrl}/post/${post.slug || post.id}`,
        lastModified: new Date(post.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Extract unique tags and add tag pages
    const uniqueTags = Array.from(new Set(publishedPosts.flatMap(p => p.tags)));
    uniqueTags.forEach(tag => {
      sitemapEntries.push({
        url: `${baseUrl}/tag/${encodeURIComponent(tag)}`,
        lastModified: new Date(), // Tags change whenever new posts arrive
        changeFrequency: 'daily',
        priority: 0.6,
      });
    });

  } catch (error: any) {
    if (error?.name !== 'AbortError' && !error?.message?.includes('aborted') && !String(error).includes('aborted')) {
      console.error("Error generating sitemap:", error);
    }
  }

  return sitemapEntries;
}
