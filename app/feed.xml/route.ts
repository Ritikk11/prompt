import { NextResponse } from 'next/server';
import { fetchPosts, fetchSettings } from '@/lib/data';
import { Post, SiteSettings } from '@/lib/types';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Returns a high-compatibility JPEG image URL using Cloudflare's dynamic converter.
 * This guarantees Pinterest's RSS scraper recognizes the media as a standard JPEG image.
 */
function toJpegFeedUrl(rawUrl: string, baseUrl: string): string {
  const abs = resolveAbsoluteUrl(rawUrl, baseUrl);
  if (!abs) return '';
  return `https://aipromptmatrix.in/cdn-cgi/image/format=jpeg,quality=85/${abs}?ext=.jpg`;
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in').replace(/\/$/, '');

  try {
    // 1. Fetch site settings for title and description
    const settings = (await fetchSettings()) as SiteSettings;
    const siteTitle = settings?.siteTitle || 'AI PromptMatrix';
    const siteDescription = settings?.siteDescription || 'Curated AI Prompts & Generative Art';

    // 2. Fetch full posts to access all prompt images
    const posts = ((await fetchPosts()) as Post[]) || [];
    const publishedPosts = posts
      .filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    const buildDate = new Date().toUTCString();

    // 3. Construct Pinterest-compatible Media RSS XML
    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-US</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
`;

    publishedPosts.forEach(post => {
      const url = `${baseUrl}/${post.slug || post.id}`;
      const baseTitle = escapeXml(post.title);
      const cleanDesc = escapeXml(post.description || post.title);
      const pubDate = new Date(post.updatedAt || post.createdAt).toUTCString();

      // Collect all valid images for this post
      const rawImageUrls: string[] = [];
      if (Array.isArray(post.images) && post.images.length > 0) {
        post.images.forEach(img => {
          if (img.url) rawImageUrls.push(img.url);
        });
      }
      if (rawImageUrls.length === 0 && post.thumbnailUrl) {
        rawImageUrls.push(post.thumbnailUrl);
      }

      // 1. Primary Pin item (First/Hero image)
      const primaryRaw = rawImageUrls[0] || '';
      const primaryJpeg = primaryRaw ? toJpegFeedUrl(primaryRaw, baseUrl) : '';

      rss += `    <item>
      <title>${baseTitle}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${primaryJpeg ? `<img src="${primaryJpeg}" alt="${post.title}" /><br/>` : ''}<p>${post.description || post.title}</p>]]></description>
      <content:encoded><![CDATA[${primaryJpeg ? `<img src="${primaryJpeg}" alt="${post.title}" /><br/>` : ''}<p>${post.description || post.title}</p>]]></content:encoded>
${primaryJpeg ? `      <enclosure url="${escapeXml(primaryJpeg)}" type="image/jpeg" length="350000" />
      <media:content url="${escapeXml(primaryJpeg)}" medium="image" type="image/jpeg" />
      <media:thumbnail url="${escapeXml(primaryJpeg)}" />\n` : ''}      <pubDate>${pubDate}</pubDate>
    </item>
`;

      // 2. If prompt has 2+ images, generate dedicated items so Pinterest creates pins for every variation
      if (rawImageUrls.length > 1) {
        for (let i = 1; i < rawImageUrls.length; i++) {
          const variantRaw = rawImageUrls[i];
          const variantJpeg = toJpegFeedUrl(variantRaw, baseUrl);
          const variantTitle = `${baseTitle} (Variation ${i + 1})`;
          const variantGuid = `${url}#image-${i + 1}`;

          rss += `    <item>
      <title>${variantTitle}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${variantGuid}</guid>
      <description><![CDATA[<img src="${variantJpeg}" alt="${post.title} Variation ${i + 1}" /><br/><p>${post.description || post.title}</p>]]></description>
      <content:encoded><![CDATA[<img src="${variantJpeg}" alt="${post.title} Variation ${i + 1}" /><br/><p>${post.description || post.title}</p>]]></content:encoded>
      <enclosure url="${escapeXml(variantJpeg)}" type="image/jpeg" length="350000" />
      <media:content url="${escapeXml(variantJpeg)}" medium="image" type="image/jpeg" />
      <media:thumbnail url="${escapeXml(variantJpeg)}" />
      <pubDate>${pubDate}</pubDate>
    </item>
`;
        }
      }
    });

    rss += `  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    if (error?.name !== 'AbortError' && !error?.message?.includes('aborted') && !String(error).includes('aborted')) {
      console.error("RSS feed error:", error);
    }
    return new NextResponse('<rss version="2.0"><channel><title>Error</title></channel></rss>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      status: 500,
    });
  }
}
