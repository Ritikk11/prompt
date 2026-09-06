import type { ReactNode } from 'react';

// Shared admin design language with GLM frosted glass aesthetics.
// Used across every settings tab so panels, headers, labels, and
// inputs stay visually identical and unified across the admin.

/** Standard input / textarea / select classes with clean frosted glass. */
export const adminInput = 'w-full px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white/80 text-xs text-surface-900 outline-none transition-all placeholder:text-surface-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-surface-500 dark:focus:border-primary-400 dark:focus:bg-white/[0.1] dark:focus:ring-primary-400/20';
export const adminInputOnCard = 'w-full px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white/60 text-xs text-surface-900 outline-none transition-all placeholder:text-surface-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-surface-500 dark:focus:border-primary-400 dark:focus:bg-white/[0.08] dark:focus:ring-primary-400/20';
export const adminLabel = 'block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1';

/** Tinted frosted banner at the top of a tab explaining what the tab controls. */
export function TabBanner({ icon, title, text, action }: {
  icon: ReactNode;
  title: string;
  text: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="p-4 rounded-2xl border border-primary-500/25 bg-primary-500/10 backdrop-blur-xl dark:border-primary-400/20 dark:bg-primary-500/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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

/** Frosted glass panel card wrapping a group of related controls. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06] sm:p-6 space-y-6 ${className}`}>
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
      <div>
        <h3 className="font-extrabold text-base text-surface-900 dark:text-white flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:border-primary-400/20 dark:bg-primary-400/15 dark:text-primary-300 font-bold">{count}</span>
          )}
        </h3>
        {subtitle && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Numbered/labelled eyebrow separating sections inside an editor. */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <h5 className="text-xs font-extrabold uppercase tracking-wider text-surface-500 dark:text-surface-400 border-l-2 border-primary-500 pl-2">{children}</h5>
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
        <div className="mb-1 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
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
    <div className={`rounded-2xl border transition-all duration-200 ${
      isEditing
        ? 'border-primary-500/50 bg-primary-500/10 shadow-md backdrop-blur-xl p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200 dark:border-primary-400/30 dark:bg-primary-500/[0.08]'
        : 'border-white/80 bg-white/40 hover:bg-white/60 hover:border-white shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] p-4'
    } ${className}`}>
      {children}
    </div>
  );
}

/**
 * Inline character-count indicator.
 * Renders as a tiny right-aligned pill showing `{current} / {recommended}`.
 * Turns amber when over the recommended limit and red when significantly over.
 */
export function CharCount({ value, recommended }: { value: string; recommended: number }) {
  const len = value.length;
  const over = len > recommended;
  const wayOver = len > recommended * 1.25;
  return (
    <div className="mt-1 flex justify-end">
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tabular-nums transition-colors ${
          wayOver
            ? 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20'
            : over
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              : 'bg-black/[0.04] text-surface-500 dark:bg-white/[0.06] dark:text-surface-400'
        }`}
      >
        {len} / {recommended}
      </span>
    </div>
  );
}

/**
 * Single canonical toggle switch. Replaces the several hand-rolled peer/button
 * checkbox toggles scattered across the admin so they all look and behave the same.
 */
export function Toggle({ checked, onChange, label, ariaLabel, disabled = false, className = '' }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`relative inline-flex items-center shrink-0 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel || (typeof label === 'string' ? label : 'Toggle setting')}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-black/[0.12] dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/40" />
      {label && <span className="ml-2.5 text-xs font-semibold text-surface-700 dark:text-surface-200">{label}</span>}
    </label>
  );
}

/**
 * Standard admin action button. One shape (rounded-xl, text-xs, font-bold) with a
 * few variants so Save / Cancel / secondary / destructive actions match everywhere.
 */
export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  title,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'success' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-primary-600 text-white shadow-sm shadow-primary-500/25 hover:bg-primary-700',
    ghost: 'text-surface-600 dark:text-surface-300 hover:bg-white/80 dark:hover:bg-white/[0.08]',
    outline: 'border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] text-surface-700 dark:text-surface-200 hover:bg-white dark:hover:bg-white/[0.12] backdrop-blur-md shadow-sm',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25',
    danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 hover:bg-rose-500/25',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Field wrapper around a resizable textarea, bundling the label/action row, the
 * canonical input styling, resize handle, and an optional CharCount so every
 * multi-line field gets the same affordances.
 */
export function FieldTextarea({
  label,
  action,
  value,
  onChange,
  rows = 3,
  placeholder,
  recommended,
  onCard = false,
  className = '',
  hint,
}: {
  label: string;
  action?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  recommended?: number;
  onCard?: boolean;
  className?: string;
  hint?: ReactNode;
}) {
  return (
    <Field label={label} action={action} className={className}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${onCard ? adminInputOnCard : adminInput} resize-y`}
      />
      {hint && <p className="text-[11px] text-surface-400 mt-1">{hint}</p>}
      {recommended !== undefined && <CharCount value={value} recommended={recommended} />}
    </Field>
  );
}
