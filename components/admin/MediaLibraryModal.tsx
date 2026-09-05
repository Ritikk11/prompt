import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { X, Image as ImageIcon, Loader2, Folder, ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { showToast } from '@/components/ui/ToastContainer';

type MediaLibraryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export default function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [images, setImages] = useState<{ url: string; key: string; size: number }[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    async function loadImages() {
      setLoading(true);
      try {
        const supabase = createClient();
        let { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          const refreshed = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
          session = refreshed.data.session;
        }

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const url = new URL('/api/images', window.location.origin);
        if (currentPrefix) url.searchParams.set('prefix', currentPrefix);
        
        const r = await fetch(url.toString(), { headers });
        const data = await r.json();
        
        if (!mounted) return;

        if (data.error) {
          showToast('API Error: ' + data.error, 'error');
          return;
        }
        if (data.images) setImages(data.images);
        if (data.folders) setFolders(data.folders);
      } catch (err: any) {
        if (mounted) {
          console.error(err);
          showToast(String(err), 'error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadImages();

    return () => {
      mounted = false;
    };
  }, [isOpen, currentPrefix]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-5xl rounded-3xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-[#090b1c]/90 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap sm:gap-2">
            <button 
              onClick={() => setCurrentPrefix('')}
              className={`flex items-center gap-2 transition-colors ${!currentPrefix ? 'text-surface-900 dark:text-white font-bold cursor-default' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white font-medium'}`}
            >
              <Home className="h-4 w-4 shrink-0 text-primary-500 sm:h-5 sm:w-5" />
              <span className="shrink-0 text-sm sm:text-lg">Library</span>
            </button>
            {currentPrefix.split('/').filter(Boolean).map((part, index, array) => {
              const prefixToHere = array.slice(0, index + 1).join('/') + '/';
              const isLast = index === array.length - 1;
              return (
                <div key={prefixToHere} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-surface-400 sm:h-4 sm:w-4" />
                  <button
                    onClick={() => setCurrentPrefix(prefixToHere)}
                    disabled={isLast}
                    className={`text-sm transition-colors sm:text-lg ${isLast ? 'text-surface-900 dark:text-white font-bold cursor-default' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white font-medium'}`}
                  >
                    {part}
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-xl transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-4 items-center justify-center h-full text-surface-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <span className="text-sm font-medium">Loading your uploads...</span>
            </div>
          ) : (folders.length > 0 || images.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {folders.map(folder => (
                <div 
                  key={folder}
                  onClick={() => setCurrentPrefix(folder)}
                  className="aspect-square flex flex-col items-center justify-center gap-3 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-md cursor-pointer hover:border-primary-500/60 hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all shadow-sm group"
                >
                  <Folder className="w-12 h-12 text-primary-500 group-hover:scale-105 transition-transform" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate px-4 w-full text-center">
                    {folder.replace(currentPrefix, '').replace(/\/$/, '')}
                  </span>
                </div>
              ))}
              {images.map(img => (
                <div 
                  key={img.key} 
                  className="aspect-square relative rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/10 cursor-pointer group hover:border-primary-500 hover:ring-2 hover:ring-primary-500/50 transition-all bg-white/40 dark:bg-white/[0.04] shadow-sm"
                  onClick={() => {
                    onSelect(img.url);
                    onClose();
                  }}
                >
                  <NextImage src={img.url} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" className="object-cover transition-transform group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-surface-400">
              <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">No images found in {currentPrefix ? 'this folder' : 'your Cloudflare R2 bucket'}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
