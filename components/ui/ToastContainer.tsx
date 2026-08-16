'use client';
import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-surface-950 text-white border border-white/10 dark:bg-white dark:text-surface-950 dark:border-surface-200',
  error: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400',
  info: 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950 dark:border-primary-900 dark:text-primary-300',
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = 'h-4 w-4 shrink-0';
  if (type === 'error') return <AlertCircle className={`${cls} text-rose-500 dark:text-rose-400`} />;
  if (type === 'info') return <Info className={`${cls} text-primary-500 dark:text-primary-400`} />;
  return <CheckCircle2 className={`${cls} text-emerald-500 dark:text-emerald-400`} />;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<Omit<ToastMessage, 'id'>>) => {
      const newToast = { ...e.detail, id: Math.random().toString(36).substring(2, 9) };
      setToasts(prev => [...prev.slice(-4), newToast]);
      // Longer messages need more reading time.
      const ttl = Math.min(8000, Math.max(4000, newToast.message.length * 60));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, ttl);
    };
    window.addEventListener('show-toast', handleToast as EventListener);
    return () => window.removeEventListener('show-toast', handleToast as EventListener);
  }, []);

  return (
    <div className="fixed inset-x-4 bottom-4 z-[999] flex flex-col gap-2 pointer-events-none sm:inset-x-auto sm:right-4">
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300 ${toastStyles[t.type]} min-w-0 sm:min-w-[250px] sm:max-w-[400px]`}
        >
          <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
            <ToastIcon type={t.type} />
            <span className="break-words whitespace-pre-line">{t.message}</span>
          </span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
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
