import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { fetchPostSummaries, fetchSeoPages, fetchSettings } from '@/lib/data';
import { submitToIndexNow } from '@/lib/indexnow';
import type { Post } from '@/lib/types';

export async function POST(request: Request) {
  try {
    // 1. Ensure caller is authenticated admin
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const settings = await fetchSettings();
    const key = settings.seoSettings?.indexNowKey;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in').replace(/\/$/, '');

    let urlsToSubmit: string[] = [];

    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urlsToSubmit = body.urls;
    } else if (body.url) {
      urlsToSubmit = [body.url];
    } else {
      // Default: fetch published posts and SEO pages
      const [posts, seoPages] = await Promise.all([
        fetchPostSummaries() as Promise<Post[]>,
        fetchSeoPages() as Promise<any[]>,
      ]);
      const published = posts.filter(
        p => (p.status === 'published' || !p.status) && p.visibility !== 'private'
      );
      const seoPageUrls = seoPages
        .filter(p => p?.slug)
        .map(p => `${siteUrl}/${String(p.slug).replace(/^\/+|\/+$/g, '')}`);

      if (body.mode === 'all') {
        urlsToSubmit = [
          siteUrl,
          `${siteUrl}/explore`,
          `${siteUrl}/blog`,
          `${siteUrl}/guides`,
          ...seoPageUrls,
          ...published.map(p => `${siteUrl}/${p.slug || p.id}`),
        ];
      } else {
        // Default mode 'recent': submit homepage, explore, SEO pages, and recent prompts
        const recent = published.slice(0, 30);
        urlsToSubmit = [
          siteUrl,
          `${siteUrl}/explore`,
          ...seoPageUrls,
          ...recent.map(p => `${siteUrl}/${p.slug || p.id}`),
        ];
      }
    }

    const result = await submitToIndexNow(urlsToSubmit, key);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'IndexNow submission failed' },
      { status: error?.status || 500 }
    );
  }
}
