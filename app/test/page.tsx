import type { Metadata } from 'next';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import GlmBackground from './GlmBackground';
import GlmHero from './GlmHero';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Test Homepage Preview | AI PromptMatrix',
  description: 'Preview test homepage with GLM cyber-glassmorphism background and showcase hero.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TestHomePage() {
  const [allPosts, settings] = await Promise.all([
    fetchPostSummaries(),
    fetchSettings(),
  ]);

  const featuredPosts = allPosts.filter(
    (p) => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private'
  );

  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-purple-500/30 selection:text-white font-sans">
      {/* GLM Animated Cyber-Glassmorphism Background */}
      <GlmBackground />

      {/* Test Page Notification Header Banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-[#05060f]/80 backdrop-blur-xl border-b border-white/10 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Test Homepage Preview</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/60">GLM Background + Showcase Hero (Main site unchanged)</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Site
          </Link>
        </div>
      </div>

      {/* Main Hero Component */}
      <main className="relative z-10">
        <GlmHero
          featuredPosts={featuredPosts.slice(0, 3)}
          totalPosts={allPosts.length}
          settings={settings}
        />
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 py-12 text-center text-xs text-white/40 border-t border-white/5">
        <p>AI PromptMatrix — Test Sandbox Environment</p>
      </footer>
    </div>
  );
}
