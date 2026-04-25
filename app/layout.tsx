import type { Metadata } from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/context/ThemeContext';
import { DataProvider } from '@/components/context/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PromptVault - AI Prompts',
  description: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900" suppressHydrationWarning>
        <ThemeProvider>
          <DataProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
