import { MetadataRoute } from 'next';
import { fetchSettings } from '@/lib/data';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const settings = await fetchSettings();
  const robotsText = settings.seoSettings?.robotsText || '';
  const allow = robotsText.match(/^Allow:\s*(.+)$/im)?.[1]?.trim() || '/';
  const disallow = Array.from(robotsText.matchAll(/^Disallow:\s*(.+)$/gim)).map(match => match[1].trim()).filter(Boolean);
  const customSitemaps = Array.from(robotsText.matchAll(/^Sitemap:\s*(.+)$/gim))
    .map(match => match[1].trim())
    .filter(Boolean);

  const defaultSitemaps = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap-prompts.xml`,
  ];

  const sitemap = customSitemaps.length > 0 ? customSitemaps : defaultSitemaps;
  const resolvedDisallow = disallow.length > 0 ? disallow : ['/admin/', '/profile/', '/api/', '/search/', '/submit/', '/login/'];

  // Explicit Allow for the major AI/LLM crawlers so training + answer-engine
  // indexing consent is unambiguous (default '*' is already permissive; this
  // makes it declarative and future-proofs against a stricter default).
  const aiCrawlers = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'Google-Extended', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'CCBot'];

  return {
    rules: [
      {
        userAgent: '*',
        allow,
        disallow: resolvedDisallow,
      },
      ...aiCrawlers.map(userAgent => ({
        userAgent,
        allow: '/',
        disallow: resolvedDisallow,
      })),
    ],
    sitemap,
  };
}
