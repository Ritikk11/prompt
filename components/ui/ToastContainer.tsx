'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<Omit<ToastMessage, 'id'>>) => {
      const newToast = { ...e.detail, id: Math.random().toString(36).substring(2, 9) };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };
    window.addEventListener('show-toast', handleToast as EventListener);
    return () => window.removeEventListener('show-toast', handleToast as EventListener);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-xl transform transition-all duration-300 translate-y-0 opacity-100 ${t.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400' : 'bg-surface-950 text-white dark:bg-white dark:text-surface-950'} min-w-[250px] max-w-[400px]`}>
          <span className="text-sm font-medium">{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function showToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  }
}
