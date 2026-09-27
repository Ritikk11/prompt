import type { Metadata } from 'next';
import { Inter, Outfit, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
// Global styles
import { ThemeProvider } from '@/components/context/ThemeContext';
import { DataProvider } from '@/components/context/DataContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import SiteBackground from '@/components/SiteBackground';
import MaintenanceBouncer from '@/components/MaintenanceBouncer';
import { fetchSections, fetchSettings } from '@/lib/data';
import { getClientSettings } from '@/lib/constants';
import { stringifyJsonLd } from '@/lib/json-ld';

// Inter (body) + Outfit (headings) render above the fold on every page, so
// they ARE preloaded: otherwise the fallback paints first and the real font
// swaps in late, reflowing text (the desktop <aside>) into a small CLS.
// Playfair is the italic accent only (rarely above the fold), so it stays
// preload:false to avoid a third high-priority font download racing the hero.
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

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['italic'],
  // The accent spans use font-bold only. Loading three declarations for the
  // same variable was enlarging the render-blocking font stylesheet.
  weight: ['700'],
  variable: '--font-serif-italic',
  display: 'swap',
  preload: false,
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
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const homeTitleTemplate = settings.seoSettings?.homeSeoTitleTemplate || '%site_title% - AI Prompts';
  const resolvedTitle = homeTitleTemplate.replace(/%site_title%/g, siteTitle);
  const description =
    settings.seoSettings?.defaultMetaDescription ||
    settings.siteDescription ||
    'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.';
  const publisherId = settings.ads?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const ogImage = settings.seoSettings?.defaultOgImage || '/og-image.webp?v=5';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in'),
    title: {
      default: resolvedTitle,
      template: `%s | ${siteTitle}`,
    },
    description,
    applicationName: siteTitle,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    manifest: '/site.webmanifest',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
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
  const [fullSettings, initialSections] = await Promise.all([
    fetchSettings(),
    fetchSections(),
  ]);
  // The client DataProvider gets settings WITHOUT the server-only content
  // bodies (legal/static page markdown, article overrides): ~80 kB of the
  // flight payload on every page that no client component reads. Server pages
  // call fetchSettings() themselves and the admin re-fetches full settings
  // via /api/admin on mount, so nothing loses data.
  const initialSettings = getClientSettings(fullSettings);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';
  const orgName = initialSettings.siteTitle || 'PromptSoul';
  const rawLogo = initialSettings.siteLogo || '/icon-256x256.webp';
  const logoUrl = rawLogo.startsWith('http') || rawLogo.startsWith('data:')
    ? rawLogo
    : `${siteUrl}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;
  const socials = initialSettings.socialLinks || {};
  const sameAs = [socials.twitter, socials.instagram, socials.youtube, socials.facebook, socials.pinterest]
    .filter((u): u is string => Boolean(u && u.trim()));

  // WebSite (with Sitelinks SearchBox) + Organization, linked via @graph so Google
  // resolves the publisher for Article rich results and brand knowledge panel.
  const customAlternateNames = initialSettings.seoSettings?.alternateSiteNames || [];
  const defaultAlternateNames = [
    'PromptSoul',
    'Prompt Soul',
    'Promptsoul',
    'prompt soul',
  ];
  const alternateNames = Array.from(
    new Set([...defaultAlternateNames, ...customAlternateNames])
  ).filter((name) => name && name.toLowerCase() !== orgName.toLowerCase());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: orgName,
        alternateName: alternateNames,
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
  // Site-wide animated glass canvas. Admin-switchable so the redesign can be
  // rolled back without a deploy. Defaults ON: the homepage blocks are glass
  // now, and glass with nothing behind it reads as flat white.
  const animatedBackground = initialSettings.features?.showAnimatedBackground ?? true;
  // The canvas paints its own base color, but html/body still show through in
  // the overscroll gutter — keep the two in step.
  const bodySurface = animatedBackground
    ? 'bg-[#f8fafc] dark:bg-[#05060f]'
    : 'bg-white dark:bg-surface-950';
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
    <html lang="en" suppressHydrationWarning className={`scroll-smooth ${inter.variable} ${outfit.variable} ${playfair.variable}`}>
      <head>
        {/* Blocking theme guard — must stay the first node in <head>.
            ThemeProvider applies the stored theme in useEffect, i.e. AFTER the
            first paint, so dark-mode users saw the whole page flash light and
            then transition to dark. This runs at HTML parse time, before any
            content below is even parsed. Mirrors ThemeProvider exactly
            (key 'pv-theme', default = light). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pv-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
        {/* Arms the scroll-reveal hidden states. The reveal CSS ships in
            globals.css so `.reveal` content is hidden from the first paint,
            but only JS ever clears it (.revealed) — so a load where the
            chunk is blocked, fails, or is merely very slow would leave every
            section painted but empty. Gating those rules behind this class
            means they apply only while JS is alive to undo them: no script,
            nothing hidden. The timer is the bounded escape hatch — if hydration
            hasn't registered a single reveal node by then, drop the class and
            show everything. ScrollReveal notices it is gone and adopts the
            content in place rather than animating it, so there is no second
            reveal. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.classList.add('reveal-armed');setTimeout(function(){if(!window.__revealReady){d.classList.remove('reveal-armed')}},4000)})();`,
          }}
        />
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
        <meta property="og:site_name" content={orgName} />
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
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
        />

        {/* Google tag (gtag.js) — queue events immediately while deferring
            external network fetch to first user interaction or idle to protect FCP/LCP */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-3SM2DNE8VW',{allow_google_signals:false,allow_ad_personalization_signals:false});(function(){var l=false;function init(){if(l)return;l=true;['scroll','touchstart','pointerdown','keydown'].forEach(function(e){window.removeEventListener(e,init,{passive:true})});var s=document.createElement('script');s.src='https://www.googletagmanager.com/gtag/js?id=G-3SM2DNE8VW';s.async=true;document.head.appendChild(s);};['scroll','touchstart','pointerdown','keydown'].forEach(function(e){window.addEventListener(e,init,{passive:true,once:true})});setTimeout(init,7000);})();`,
          }}
        />
      </head>
      {/* overflow-x-clip on body (not -hidden): `hidden` turns body into a
          scroll container, so any transient vertical overflow (scroll-reveal
          translateY) flashes a second scrollbar and shifts the layout. */}
      <body className={`antialiased min-h-screen flex flex-col ${bodySurface} text-surface-950 dark:text-surface-50 selection:bg-primary-500/30 selection:text-primary-900 dark:selection:bg-primary-500/40 dark:selection:text-white`} suppressHydrationWarning>
        {animatedBackground && <SiteBackground />}
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
            {/* Reserves the fixed bar's row. The header has to be `fixed` so its
                search / mobile / mega panels overlay the page instead of pushing
                it down when they expand — keep this height in step with the
                h-14 bar and the progress strip's top offset in Header.tsx. */}
            <div className="h-14 shrink-0" aria-hidden />
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
