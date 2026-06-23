import { MetadataRoute } from 'next';
import { fetchPosts, fetchSeoPages, fetchSections, fetchSettings } from '@/lib/data';
import { Post, Section } from '@/lib/types';
import { getAuthors } from '@/lib/authors';

export const dynamic = 'force-dynamic';


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
    const [posts, seoPages, sections, settings] = await Promise.all([
      fetchPosts() as Promise<Post[]>,
      fetchSeoPages() as Promise<any[]>,
      fetchSections() as Promise<Section[]>,
      fetchSettings(),
    ]);
    const include = settings.seoSettings?.sitemapInclude || {};

    // Add unique posts
    if (include.posts ?? true) {
      const publishedPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
      publishedPosts.forEach(post => {
        sitemapEntries.push({
          url: `${baseUrl}/${post.slug || post.id}`,
          lastModified: new Date(post.createdAt),
          changeFrequency: 'daily',
          priority: 1.0,
        });
      });
    }
    
    // Add SEO Pages
    if (include.staticPages ?? true) {
      seoPages.forEach(page => {
        sitemapEntries.push({
          url: `${baseUrl}/page/${page.slug}`,
          lastModified: page.createdAt ? new Date(page.createdAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      });
      ['about', 'contact', 'privacy', 'terms', 'dmca', 'disclaimer', 'submit'].forEach(path => {
        sitemapEntries.push({
          url: `${baseUrl}/${path}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }

    getAuthors(settings).filter(author => author.active !== false).forEach(author => {
      sitemapEntries.push({
        url: `${baseUrl}/author/${author.slug}`,
        lastModified: author.updatedAt ? new Date(author.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });

    // Add Homepage Sections (if they have slugs)
    if (include.sections ?? true) {
      sections.filter(s => s.slug && s.visible).forEach(section => {
        sitemapEntries.push({
          url: `${baseUrl}/section/${section.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.7,
        });
      });
    }

  } catch (error: any) {
    if (error?.name !== 'AbortError' && !error?.message?.includes('aborted') && !String(error).includes('aborted')) {
      console.error("Error generating sitemap:", error);
    }
  }

  return sitemapEntries;
}
