import { NextResponse } from 'next/server';
import { fetchSettings } from '@/lib/data';

export const revalidate = 3600;

export async function GET() {
  const settings = await fetchSettings();
  const publisherId = settings.ads?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  let content = '';

  if (settings.ads?.adsTxt && settings.ads.adsTxt.trim()) {
    content = settings.ads.adsTxt.trim();
  } else if (publisherId && publisherId.trim()) {
    const cleanPubId = publisherId.trim().replace(/^ca-/, '');
    content = `google.com, ${cleanPubId}, DIRECT, f08c47fec0942fa0`;
  } else {
    content = `# ads.txt - PromptSoul
# Configure your Google AdSense Publisher ID in Admin > Settings > Ads & scripts
`;
  }

  // Ensure trailing newline
  if (!content.endsWith('\n')) {
    content += '\n';
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
