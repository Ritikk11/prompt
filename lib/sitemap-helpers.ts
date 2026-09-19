import { fetchPostSummaries, fetchSeoPages, fetchSections, fetchSettings } from '@/lib/data';
import { Post, Section } from '@/lib/types';
import { getArticlesForSettings } from '@/lib/content';
import { getAllTools } from '@/lib/constants';

export interface SitemapItem {
  url: string;
  lastModified?: Date | string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toW3cDate(d?: Date | string): string {
  if (!d) return new Date().toISOString().split('T')[0];
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  return dateObj.toISOString().split('T')[0];
}

/**
 * Builds compliant sitemap XML for a list of URLs (<urlset>)
 */
export function buildUrlSetXml(items: SitemapItem[]): string {
  const seen = new Set<string>();
  const uniqueItems = items.filter(item => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const item of uniqueItems) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(item.url)}</loc>\n`;
    if (item.lastModified) {
      xml += `    <lastmod>${toW3cDate(item.lastModified)}</lastmod>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Builds compliant sitemap index XML (<sitemapindex>)
 */
export function buildSitemapIndexXml(sitemaps: { loc: string; lastmod?: Date | string }[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const sitemap of sitemaps) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(sitemap.loc)}</loc>\n`;
    if (sitemap.lastmod) {
      xml += `    <lastmod>${toW3cDate(sitemap.lastmod)}</lastmod>\n`;
    }
    xml += `  </sitemap>\n`;
  }

  xml += `</sitemapindex>`;
  return xml;
}

/**
 * Fetches and builds the Main Pages Sitemap (everything except individual prompt post URLs)
 */
export async function generateMainSitemapXml(): Promise<string> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in').replace(/\/$/, '');
  const now = new Date();
  const entries: SitemapItem[] = [
    { url: `${baseUrl}`, lastModified: now },
    { url: `${baseUrl}/explore`, lastModified: now },
    { url: `${baseUrl}/blog`, lastModified: now },
    { url: `${baseUrl}/guides`, lastModified: now },
  ];

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

    // 1. Blog & Guide articles
    getArticlesForSettings(settings).forEach(article => {
      entries.push({
        url: `${baseUrl}/${article.category === 'guide' ? 'guides' : 'blog'}/${article.slug}`,
        lastModified: new Date(article.dateModified || article.datePublished),
      });
    });

    // 2. AI Tools
    if (include.tools ?? true) {
      const tools = Array.from(new Set(publishedPosts.flatMap(post => getAllTools(post)).filter(Boolean)));
      tools.forEach(tool => {
        const toolPosts = publishedPosts.filter(post => getAllTools(post).some(item => item.toLowerCase() === tool.toLowerCase()));
        const lastModified = toolPosts
          .map(post => new Date(post.createdAt).getTime())
          .filter(Number.isFinite)
          .sort((a, b) => b - a)[0];
        entries.push({
          url: `${baseUrl}/tool/${encodeURIComponent(tool.toLowerCase())}`,
          lastModified: lastModified ? new Date(lastModified) : now,
        });
      });
    }

    // 3. Tags
    if (include.tags ?? true) {
      const tags = Array.from(new Set(publishedPosts.flatMap(post => post.tags || []).filter(Boolean)));
      tags.forEach(tag => {
        const tagPosts = publishedPosts.filter(post => post.tags?.some(item => item.toLowerCase() === tag.toLowerCase()));
        const lastModified = tagPosts
          .map(post => new Date(post.createdAt).getTime())
          .filter(Number.isFinite)
          .sort((a, b) => b - a)[0];
        entries.push({
          url: `${baseUrl}/tag/${encodeURIComponent(tag.toLowerCase())}`,
          lastModified: lastModified ? new Date(lastModified) : now,
        });
      });
    }

    // 4. SEO Pages & Static Pages
    if (include.staticPages ?? true) {
      seoPages.forEach(page => {
        const slug = String(page.slug || '').replace(/^\/+|\/+$/g, '');
        if (!slug) return;
        if (!postSlugs.has(slug) && !staticPaths.includes(slug)) {
          entries.push({
            url: `${baseUrl}/${slug}`,
            lastModified: page.updatedAt ? new Date(page.updatedAt) : (page.createdAt ? new Date(page.createdAt) : now),
          });
        }
      });

      staticPaths.forEach(path => {
        entries.push({
          url: `${baseUrl}/${path}`,
          lastModified: now,
        });
      });
    }

    // 5. Sections
    if (include.sections ?? true) {
      sections.filter(s => s.slug && s.visible).forEach(section => {
        entries.push({
          url: `${baseUrl}/section/${section.slug}`,
          lastModified: now,
        });
      });
    }
  } catch (err) {
    console.error('Error generating main sitemap entries:', err);
  }

  return buildUrlSetXml(entries);
}

/**
 * Fetches and builds the dedicated Prompts Sitemap (only published prompt post URLs)
 */
export async function generatePromptsSitemapXml(): Promise<string> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in').replace(/\/$/, '');
  const now = new Date();
  const entries: SitemapItem[] = [];

  try {
    const posts = (await fetchPostSummaries()) as Post[];
    const publishedPosts = posts.filter(
      p => (p.status === 'published' || !p.status) && p.visibility !== 'private'
    );

    publishedPosts.forEach(post => {
      const slug = post.slug || post.id;
      if (!slug) return;
      entries.push({
        url: `${baseUrl}/${slug}`,
        lastModified: post.updatedAt || post.createdAt || now,
      });
    });
  } catch (err) {
    console.error('Error generating prompts sitemap entries:', err);
  }

  return buildUrlSetXml(entries);
}

/**
 * Builds the Master Sitemap Index linking to /sitemap-main.xml and /sitemap-prompts.xml
 */
export async function generateSitemapIndexXml(): Promise<string> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in').replace(/\/$/, '');
  const now = new Date();

  // Find latest prompt update date if available
  let latestPromptDate = now;
  try {
    const posts = (await fetchPostSummaries()) as Post[];
    const published = posts.filter(
      p => (p.status === 'published' || !p.status) && p.visibility !== 'private'
    );
    if (published.length > 0) {
      const timestamps = published
        .map(p => new Date(p.updatedAt || p.createdAt).getTime())
        .filter(Number.isFinite)
        .sort((a, b) => b - a);
      if (timestamps[0]) latestPromptDate = new Date(timestamps[0]);
    }
  } catch {}

  const sitemaps = [
    { loc: `${baseUrl}/sitemap-main.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-prompts.xml`, lastmod: latestPromptDate },
  ];

  return buildSitemapIndexXml(sitemaps);
}
