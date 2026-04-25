'use client';
import Link from 'next/link';

import { Sparkles, Heart } from 'lucide-react';
import { useData } from '@/components/context/DataContext';

export default function Footer() {
  const { settings } = useData();

  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">{settings.siteTitle}</span>
            </Link>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              {settings.siteDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Home</Link>
              <Link href="/explore" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Explore All</Link>
              <Link href="/admin" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Admin Panel</Link>
            </div>
          </div>

          {/* AI Tools */}
          <div>
            <h3 className="font-semibold mb-4">AI Tools</h3>
            <div className="flex flex-wrap gap-2">
              {(settings.aiTools || []).slice(0, 10).map(tool => (
                <Link
                  key={tool}
                  href={`/search?q=${encodeURIComponent(tool)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  {tool}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-400">© 2025 {settings.siteTitle}. All rights reserved.</p>
          <div className="flex items-center gap-1 text-sm text-surface-400">
            Made with <Heart className="w-3.5 h-3.5 text-red-400 mx-0.5 fill-red-400" /> for AI enthusiasts
          </div>
        </div>
      </div>
    </footer>
  );
}
