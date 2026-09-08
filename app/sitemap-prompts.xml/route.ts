import { NextResponse } from 'next/server';
import { generatePromptsSitemapXml } from '@/lib/sitemap-helpers';

export const revalidate = 3600;

export async function GET() {
  const xml = await generatePromptsSitemapXml();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
