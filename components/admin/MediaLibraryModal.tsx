import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Folder, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

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
          headers.Authorization = \Bearer \\;
        }

        const url = new URL('/api/images', window.location.origin);
        if (currentPrefix) url.searchParams.set('prefix', currentPrefix);
        
        const r = await fetch(url.toString(), { headers });
        const data = await r.json();
        
        if (!mounted) return;

        if (data.error) {
          alert('API Error: ' + data.error);
          return;
        }
        if (data.images) setImages(data.images);
        if (data.folders) setFolders(data.folders);
      } catch (err: any) {
        if (mounted) {
          console.error(err);
          alert(String(err));
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-surface-200 dark:border-surface-800">
        <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800/50 flex items-center justify-between bg-surface-50/50 dark:bg-surface-900/50">
          <div className="flex items-center gap-3">
            {currentPrefix && (
              <button onClick={() => setCurrentPrefix('')} className="p-2 -ml-2 text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-800 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-500" />
              {currentPrefix ? \Library / \\ : 'Media Library'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-800 rounded-xl transition-colors">
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
                  className="aspect-square flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 cursor-pointer hover:border-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <Folder className="w-12 h-12 text-primary-400" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate px-4 w-full text-center">
                    {folder.replace(currentPrefix, '').replace(/\\/$/, '')}
                  </span>
                </div>
              ))}
              {images.map(img => (
                <div 
                  key={img.key} 
                  className="aspect-square relative rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 cursor-pointer group hover:border-primary-500 hover:ring-2 hover:ring-primary-500/50 transition-all bg-surface-100 dark:bg-surface-950"
                  onClick={() => {
                    onSelect(img.url);
                    onClose();
                  }}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
