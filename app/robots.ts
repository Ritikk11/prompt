import { MetadataRoute } from 'next';
import { fetchSettings } from '@/lib/data';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const settings = await fetchSettings();
  const robotsText = settings.seoSettings?.robotsText || '';
  const allow = robotsText.match(/^Allow:\s*(.+)$/im)?.[1]?.trim() || '/';
  const disallow = Array.from(robotsText.matchAll(/^Disallow:\s*(.+)$/gim)).map(match => match[1].trim()).filter(Boolean);
  const sitemap = robotsText.match(/^Sitemap:\s*(.+)$/im)?.[1]?.trim() || `${baseUrl}/sitemap.xml`;

  return {
    rules: {
      userAgent: '*',
      allow,
      disallow: disallow.length > 0 ? disallow : ['/admin/', '/profile/'],
    },
    sitemap,
  };
}
