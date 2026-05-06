import { MetadataRoute } from 'next';
import { getAllPostsREST, getAllSeoPagesREST, getAllSectionsREST } from '@/lib/firebase-rest';
import { Post, Section } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Determine site URL dynamically or hardcode for now
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

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
    const [posts, seoPages, sections] = await Promise.all([
      getAllPostsREST() as Promise<Post[]>,
      getAllSeoPagesREST() as Promise<any[]>,
      getAllSectionsREST() as Promise<Section[]>
    ]);

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
    
    // Add SEO Pages
    seoPages.forEach(page => {
      sitemapEntries.push({
        url: `${baseUrl}/page/${page.slug}`,
        lastModified: page.createdAt ? new Date(page.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });

    // Add Homepage Sections (if they have slugs)
    sections.filter(s => s.slug && s.visible).forEach(section => {
      sitemapEntries.push({
        url: `${baseUrl}/section/${section.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    });

  } catch (error: any) {
    if (error?.name !== 'AbortError' && !error?.message?.includes('aborted') && !String(error).includes('aborted')) {
      console.error("Error generating sitemap:", error);
    }
  }

  return sitemapEntries;
}
