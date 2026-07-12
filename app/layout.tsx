import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
 // Global styles
import { ThemeProvider } from '@/components/context/ThemeContext';
import { DataProvider } from '@/components/context/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import { fetchSections, fetchSettings } from '@/lib/data';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

function toOrigin(value?: string | null) {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const siteTitle = settings.siteTitle || 'AI PromptMatrix';
  const description =
    settings.seoSettings?.defaultMetaDescription ||
    settings.siteDescription ||
    'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.';
  const publisherId = settings.ads?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const ogImage = settings.seoSettings?.defaultOgImage;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in'),
    title: `${siteTitle} - AI Prompts`,
    description,
    ...(ogImage ? { openGraph: { images: [{ url: ogImage }] } } : {}),
    ...(publisherId ? { other: { 'google-adsense-account': publisherId } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI PromptMatrix',
    alternateName: ['AI PromptMatrix', 'Prompt Matrix'],
    url: 'https://aipromptmatrix.in',
  };

  const [initialSettings, initialSections] = await Promise.all([
    fetchSettings(),
    fetchSections(),
  ]);
  const adsensePublisherId = initialSettings.ads?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const imagePreconnectOrigins = Array.from(new Set([
    toOrigin(process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || 'https://uploads.aipromptmatrix.in'),
    toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
  ].filter(Boolean)));

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
        {imagePreconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} />
        ))}
        {adsensePublisherId && initialSettings.ads?.autoAdsEnabled && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
            crossOrigin="anonymous"
          />
        )}
        {initialSettings.seoSettings?.googleVerification && (
          <meta name="google-site-verification" content={initialSettings.seoSettings.googleVerification} />
        )}
        {initialSettings.seoSettings?.bingVerification && (
          <meta name="msvalidate.01" content={initialSettings.seoSettings.bingVerification} />
        )}
        {initialSettings.seoSettings?.pinterestVerification && (
          <meta name="p:domain_verify" content={initialSettings.seoSettings.pinterestVerification} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden font-sans transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <DataProvider 
            initialSettings={initialSettings}
            initialSections={initialSections}
            initialPosts={[]}
          >
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <AdSlot placement="header" className="max-w-7xl mx-auto w-full px-4" />
            <main className="flex-1 w-full min-h-[80vh]">
              {children}
            </main>
            <Footer />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
