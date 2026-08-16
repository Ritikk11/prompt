import { MetadataRoute } from 'next';
import { fetchPostSummaries, fetchSeoPages, fetchSections, fetchSettings } from '@/lib/data';
import { Post, Section } from '@/lib/types';
import { getArticlesForSettings } from '@/lib/content';
import { getAllTools } from '@/lib/constants';

export const revalidate = 3600;


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Determine site URL dynamically or hardcode for now
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in').replace(/\/$/, '');
  const now = new Date();
  const seenUrls = new Set<string>();
  const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
    if (seenUrls.has(entry.url)) return;
    seenUrls.add(entry.url);
    sitemapEntries.push(entry);
  };

  // Note: Google explicitly ignores <priority> and <changefreq> in sitemaps, so
  // only <loc> and <lastmod> are emitted here. See
  // https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  const sitemapEntries: MetadataRoute.Sitemap = [];
  const baseEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now },
    { url: `${baseUrl}/explore`, lastModified: now },
    { url: `${baseUrl}/blog`, lastModified: now },
    { url: `${baseUrl}/guides`, lastModified: now },
  ];
  baseEntries.forEach(addEntry);

  try {
    const [posts, seoPages, sections, settings] = await Promise.all([
      fetchPostSummaries() as Promise<Post[]>,
      fetchSeoPages() as Promise<any[]>,
      fetchSections() as Promise<Section[]>,
      fetchSettings(),
    ]);
    const include = settings.seoSettings?.sitemapInclude || {};
    const publishedPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
    const postSlugs = new Set(publishedPosts.map(post => post.slug || post.id).filter(Boolean));
    const staticPaths = ['about', 'contact', 'privacy', 'terms', 'dmca', 'disclaimer', 'cookies'];

    getArticlesForSettings(settings).forEach(article => {
      addEntry({
        url: `${baseUrl}/${article.category === 'guide' ? 'guides' : 'blog'}/${article.slug}`,
        lastModified: new Date(article.dateModified || article.datePublished),
      });
    });

    // Add unique posts
    if (include.posts ?? true) {
      publishedPosts.forEach(post => {
        addEntry({
          url: `${baseUrl}/${post.slug || post.id}`,
          // updatedAt isn't exposed by public_post_summaries yet; falls back to
          // createdAt until the view is migrated.
          lastModified: new Date(post.updatedAt || post.createdAt),
        });
      });
    }

    if (include.tools ?? true) {
      const tools = Array.from(new Set(publishedPosts.flatMap(post => getAllTools(post)).filter(Boolean)));
      tools.forEach(tool => {
        const toolPosts = publishedPosts.filter(post => getAllTools(post).some(item => item.toLowerCase() === tool.toLowerCase()));
        const lastModified = toolPosts
          .map(post => new Date(post.createdAt).getTime())
          .filter(Number.isFinite)
          .sort((a, b) => b - a)[0];
        addEntry({
          url: `${baseUrl}/tool/${encodeURIComponent(tool.toLowerCase())}`,
          lastModified: lastModified ? new Date(lastModified) : now,
        });
      });
    }

    if (include.tags ?? true) {
      const tags = Array.from(new Set(publishedPosts.flatMap(post => post.tags || []).filter(Boolean)));
      tags.forEach(tag => {
        const tagPosts = publishedPosts.filter(post => post.tags?.some(item => item.toLowerCase() === tag.toLowerCase()));
        const lastModified = tagPosts
          .map(post => new Date(post.createdAt).getTime())
          .filter(Number.isFinite)
          .sort((a, b) => b - a)[0];
        addEntry({
          url: `${baseUrl}/tag/${encodeURIComponent(tag.toLowerCase())}`,
          lastModified: lastModified ? new Date(lastModified) : now,
        });
      });
    }
    
    // Add SEO Pages
    if (include.staticPages ?? true) {
      seoPages.forEach(page => {
        const slug = String(page.slug || '').replace(/^\/+|\/+$/g, '');
        if (!slug) return;
        addEntry({
          url: `${baseUrl}/page/${page.slug}`,
          lastModified: page.createdAt ? new Date(page.createdAt) : new Date(),
        });
        if (!postSlugs.has(slug) && !staticPaths.includes(slug)) {
          addEntry({
            url: `${baseUrl}/${slug}`,
            lastModified: page.createdAt ? new Date(page.createdAt) : now,
          });
        }
      });
      staticPaths.forEach(path => {
        addEntry({
          url: `${baseUrl}/${path}`,
          lastModified: now,
        });
      });
    }

    // Add Homepage Sections (if they have slugs)
    if (include.sections ?? true) {
      sections.filter(s => s.slug && s.visible).forEach(section => {
        addEntry({
          url: `${baseUrl}/section/${section.slug}`,
          lastModified: now,
        });
      });
    }

  } catch (error: any) {
    getArticlesForSettings().forEach(article => {
      addEntry({
        url: `${baseUrl}/${article.category === 'guide' ? 'guides' : 'blog'}/${article.slug}`,
        lastModified: new Date(article.dateModified || article.datePublished),
      });
    });
    if (error?.name !== 'AbortError' && !error?.message?.includes('aborted') && !String(error).includes('aborted')) {
      console.error("Error generating sitemap:", error);
    }
  }

  return sitemapEntries;
}
