import Link from 'next/link';
import { Search, Home, Cpu } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 flex items-center justify-center rounded-2xl mb-6">
        <Cpu className="w-8 h-8 text-surface-500" />
      </div>

      <h1 className="text-5xl md:text-6xl font-black mb-4 text-surface-900 dark:text-white">
        404
      </h1>

      <h2 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">
        Page Not Found
      </h2>
      <p className="text-surface-600 dark:text-surface-400 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>

      <form action="/search" className="w-full max-w-sm mb-8 relative">
        <input 
          name="q" 
          placeholder="Search for something real..."
          className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </form>

      <Link 
        href="/"
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-medium hover:bg-surface-800 dark:hover:bg-surface-200 transition-all active:scale-95"
      >
        <Home className="w-5 h-5" /> Back to Home
      </Link>
    </div>
  );
}
