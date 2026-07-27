'use client';
import type { ReactNode } from 'react';

// Shared admin design language, extracted from the AI Tools editor (the reference
// section). Use these for every settings tab so panels, headers, labels, and
// inputs stay visually identical across the admin.

/** Standard input / textarea / select classes. */
export const adminInput = 'w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500 transition-colors';
export const adminInputOnCard = 'w-full px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500 transition-colors';
export const adminLabel = 'block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1';

/** Tinted banner at the top of a tab explaining what the tab controls. */
export function TabBanner({ icon, title, text, action }: {
  icon: ReactNode;
  title: string;
  text: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl border border-primary-200 bg-primary-50/60 dark:border-primary-800/40 dark:bg-primary-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
        <div>
          <h4 className="text-sm font-bold text-surface-900 dark:text-white">{title}</h4>
          <p className="text-xs text-surface-600 dark:text-surface-300 mt-0.5">{text}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** White panel card wrapping a group of related controls. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/** Bordered header row inside a Panel: title + optional count pill + subtitle + right-aligned actions. */
export function PanelHeader({ title, count, subtitle, actions }: {
  title: string;
  count?: number;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
      <div>
        <h3 className="font-extrabold text-base text-surface-900 dark:text-white flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300 font-bold">{count}</span>
          )}
        </h3>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Numbered/labelled eyebrow separating sections inside an editor. */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <h5 className="text-xs font-extrabold uppercase tracking-wider text-surface-500 border-l-2 border-primary-500 pl-2">{children}</h5>
  );
}

/** Field wrapper: bold mini label (with optional inline action, e.g. a WandButton) above the control. */
export function Field({ label, action, children, className = '' }: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {action ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300">{label}</label>
          {action}
        </div>
      ) : (
        <label className={adminLabel}>{label}</label>
      )}
      {children}
    </div>
  );
}

/** Collapsed list-item card that highlights while editing (AI tool card pattern). */
export function EditableCard({ isEditing, children, className = '' }: {
  isEditing: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border transition-all ${
      isEditing
        ? 'border-primary-500/50 bg-primary-50/10 dark:bg-primary-950/10 shadow-md p-6 space-y-6'
        : 'border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 hover:border-surface-300 dark:hover:border-surface-700 p-4'
    } ${className}`}>
      {children}
    </div>
  );
}
