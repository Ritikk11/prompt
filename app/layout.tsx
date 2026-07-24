import type { Metadata } from 'next';
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
  const ogImage = settings.seoSettings?.defaultOgImage || '/og-image.png';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in'),
    title: `${siteTitle} - AI Prompts`,
    description,
    applicationName: siteTitle,
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
        { url: '/icon-256x256.png', sizes: '256x256', type: 'image/png' },
        { url: '/icon-1024x1024.png', sizes: '1024x1024', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
    },
    manifest: '/site.webmanifest',
    openGraph: {
      siteName: siteTitle,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: siteTitle }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteTitle} - AI Prompts`,
      description,
      site: settings.seoSettings?.twitterHandle || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(publisherId ? { other: { 'google-adsense-account': publisherId } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI PromptMatrix',
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
        {/* Favicons, apple-touch-icon and manifest are declared once via the
            Metadata `icons`/`manifest` fields in generateMetadata — do not add
            manual <link> tags here or the same sizes get emitted twice. */}
        {imagePreconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="" />
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
      {/* overflow-x-clip on body (not -hidden): `hidden` turns body into a
          scroll container, so any transient vertical overflow (scroll-reveal
          translateY) flashes a second scrollbar and shifts the layout. */}
      <body className="min-h-screen flex flex-col overflow-x-clip font-sans transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <DataProvider
            initialSettings={initialSettings}
            initialSections={initialSections}
            initialPosts={[]}
          >
            {/* No Suspense around Header: a boundary here lets React stream the
                header after the page body, so it pops in late and shifts the
                whole page down. The useSearchParams() call that once required
                a boundary is isolated inside Header (RouteChangeComplete). */}
            <Header />
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
