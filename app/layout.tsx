import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/context/ThemeContext';
import { DataProvider } from '@/components/context/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';

// Import Firebase
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Post, SiteSettings, Section } from '@/lib/types';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in'),
  title: 'Prompt Matrix - AI Prompts',
  description: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  other: {
    'google-adsense-account': 'ca-pub-7670949318287729' // User needs to replace this
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialPosts: Post[] = [];
  let initialSections: Section[] = [];
  let initialSettings: SiteSettings | undefined;

  try {
    const [postsSnap, sectionsSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, 'posts')),
      getDocs(collection(db, 'sections')),
      getDoc(doc(db, 'settings', 'global')),
    ]);

    initialPosts = JSON.parse(JSON.stringify(postsSnap.docs.map(d => d.data())));
    initialSections = JSON.parse(JSON.stringify(sectionsSnap.docs.map(d => d.data())));
    if (settingsSnap.exists()) {
      initialSettings = JSON.parse(JSON.stringify(settingsSnap.data()));
    }
  } catch (err) {
    console.error('Error fetching SSR data from Firebase Web SDK:', err);
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <body className="min-h-screen flex flex-col font-sans transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <DataProvider initialPosts={initialPosts} initialSections={initialSections} initialSettings={initialSettings}>
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
