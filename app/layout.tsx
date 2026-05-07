import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/context/ThemeContext';
import { DataProvider } from '@/components/context/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in'),
  title: 'Ai PromptMatrix - AI Prompts',
  description: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  other: {
    'google-adsense-account': 'ca-pub-7670949318287729' // User needs to replace this
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ai PromptMatrix',
    alternateName: ['AI Prompt Matrix', 'Prompt Matrix'],
    url: 'https://aipromptmatrix.in',
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <DataProvider>
            <Header />
            <div className="min-h-[100px] md:min-h-[120px] flex items-center justify-center">
              <AdSlot placement="header" className="max-w-7xl mx-auto w-full px-4" />
            </div>
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
