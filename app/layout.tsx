import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
// Global styles
import { ThemeProvider } from '@/components/context/ThemeContext';
import { DataProvider } from '@/components/context/DataContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import MaintenanceBouncer from '@/components/MaintenanceBouncer';
import { fetchSections, fetchSettings } from '@/lib/data';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
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
  const homeTitleTemplate = settings.seoSettings?.homeSeoTitleTemplate || '%site_title% - AI Prompts';
  const resolvedTitle = homeTitleTemplate.replace(/%site_title%/g, siteTitle);
  const description =
    settings.seoSettings?.defaultMetaDescription ||
    settings.siteDescription ||
    'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.';
  const publisherId = settings.ads?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const ogImage = settings.seoSettings?.defaultOgImage || '/og-image.jpg?v=3';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in'),
    title: {
      default: resolvedTitle,
      template: `%s | ${siteTitle}`,
    },
    description,
    applicationName: siteTitle,
    icons: {
      icon: [
        { url: '/favicon.ico?v=3' },
        { url: '/favicon-16x16.jpg?v=3', sizes: '16x16', type: 'image/jpeg' },
        { url: '/favicon-32x32.jpg?v=3', sizes: '32x32', type: 'image/jpeg' },
        { url: '/favicon-48x48.jpg?v=3', sizes: '48x48', type: 'image/jpeg' },
        { url: '/icon-256x256.jpg?v=3', sizes: '256x256', type: 'image/jpeg' },
      ],
      apple: [
        { url: '/apple-touch-icon.jpg?v=3', sizes: '180x180', type: 'image/jpeg' },
      ],
      shortcut: '/favicon.ico?v=3',
    },
    manifest: '/site.webmanifest',
    openGraph: {
      siteName: siteTitle,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: siteTitle }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      site: settings.seoSettings?.twitterHandle || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(publisherId ? { other: { 'google-adsense-account': publisherId } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [initialSettings, initialSections] = await Promise.all([
    fetchSettings(),
    fetchSections(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const orgName = initialSettings.siteTitle || 'AI PromptMatrix';
  const rawLogo = initialSettings.siteLogo || '/icon-256x256.jpg';
  const logoUrl = rawLogo.startsWith('http') || rawLogo.startsWith('data:')
    ? rawLogo
    : `${siteUrl}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;
  const socials = initialSettings.socialLinks || {};
  const sameAs = [socials.twitter, socials.instagram, socials.youtube, socials.facebook, socials.pinterest]
    .filter((u): u is string => Boolean(u && u.trim()));

  // WebSite (with Sitelinks SearchBox) + Organization, linked via @graph so Google
  // resolves the publisher for Article rich results and brand knowledge panel.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: orgName,
        url: siteUrl,
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: orgName,
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
        },
        ...(sameAs.length ? { sameAs } : {}),
      },
    ],
  };

  const adsensePublisherId = initialSettings.ads?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  // Preconnect to the uploads/Supabase hosts only when edge resizing is OFF.
  // With resizing on, all images load from aipromptmatrix.in/cdn-cgi/... (same
  // origin) — Lighthouse flagged both preconnects as unused connections.
  const imagePreconnectOrigins = process.env.NEXT_PUBLIC_ENABLE_CLOUDFLARE_IMAGE_RESIZE === 'true'
    ? []
    : Array.from(new Set([
      toOrigin(process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || 'https://uploads.aipromptmatrix.in'),
      toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
    ].filter(Boolean)));

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* Favicons, apple-touch-icon and manifest are declared once via the
            Metadata `icons`/`manifest` fields in generateMetadata — do not add
            manual <link> tags here or the same sizes get emitted twice. */}
        {imagePreconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="" />
        ))}
        {adsensePublisherId && initialSettings.ads?.autoAdsEnabled && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
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
        
        {/* Google tag (gtag.js) — lazyOnload defers it to browser idle time.
            afterInteractive ran gtag's 165 KiB eval inside the LCP window
            (Lighthouse: 122ms main-thread block, 70KiB unused JS on prompt
            pages); idle loading keeps analytics while freeing the critical path. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3SM2DNE8VW"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3SM2DNE8VW');
          `}
        </Script>
      </head>
      {/* overflow-x-clip on body (not -hidden): `hidden` turns body into a
          scroll container, so any transient vertical overflow (scroll-reveal
          translateY) flashes a second scrollbar and shifts the layout. */}
      <body className="antialiased min-h-screen flex flex-col bg-white text-surface-950 dark:bg-surface-950 dark:text-surface-50 selection:bg-primary-500/30 selection:text-primary-900 dark:selection:bg-primary-500/40 dark:selection:text-white" suppressHydrationWarning>
        <ToastContainer />
        <MaintenanceBouncer isMaintenanceMode={initialSettings.maintenanceMode} />
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
