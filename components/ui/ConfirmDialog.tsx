'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

/**
 * Styled replacement for window.confirm(), matched to the admin design system.
 *
 * Usage: mount <ConfirmDialogHost /> once (the admin page does), then anywhere:
 *   if (await confirmAction({ title: 'Delete post?', message: '…' })) { … }
 *
 * confirmAction resolves false when the dialog is dismissed via backdrop,
 * Escape, or the cancel button, mirroring native confirm() semantics.
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

type Resolver = (confirmed: boolean) => void;

let dispatchConfirm: ((options: ConfirmOptions, resolve: Resolver) => void) | null = null;

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    if (!dispatchConfirm) {
      // Host not mounted (e.g. used outside the admin) — fall back to native.
      resolve(window.confirm(options.title));
      return;
    }
    dispatchConfirm(options, resolve);
  });
}

interface ActiveDialog extends ConfirmOptions {
  resolve: Resolver;
}

export function ConfirmDialogHost() {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (options: ConfirmOptions, resolve: Resolver) => setDialog({ ...options, resolve });
    dispatchConfirm = handler;
    return () => {
      // Only release the global ref if a newer host hasn't already replaced it.
      if (dispatchConfirm === handler) dispatchConfirm = null;
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;
    confirmButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  const finish = (confirmed: boolean) => {
    dialog?.resolve(confirmed);
    setDialog(null);
  };

  if (!dialog) return null;

  const isDanger = dialog.variant !== 'primary';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white/5 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => finish(false)}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={dialog.title}
        className="w-full max-w-sm rounded-2xl border border-white/80 bg-white/60 p-5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isDanger
              ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
              : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
          }`}>
            {isDanger ? (dialog.message?.toLowerCase().includes('delete') ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />) : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-surface-950 dark:text-white">{dialog.title}</h3>
            {dialog.message && (
              <p className="mt-1 text-xs leading-relaxed text-surface-500 dark:text-surface-400">{dialog.message}</p>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => finish(false)}
            className="rounded-xl px-4 py-2 text-xs font-bold text-surface-600 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10 dark:text-surface-300 dark:hover:bg-white/10"
          >
            {dialog.cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => finish(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {dialog.confirmLabel || (isDanger ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
