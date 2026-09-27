import { NextResponse } from 'next/server';
import { generateMainSitemapXml } from '@/lib/sitemap-helpers';

export const revalidate = 2592000;

export async function GET() {
  const xml = await generateMainSitemapXml();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
    },
  });
}
