import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement, ReactNode } from 'react';
import { Check, ChevronDown, Plus, Sparkles, Tag, X } from 'lucide-react';

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

// ---- AdminSelect -----------------------------------------------------------
// Custom frosted-glass dropdown replacing the native <select> menu, which the
// OS/browser would otherwise render as an unstyled popup that clashes with the
// glassmorphism admin. The closed trigger reuses the same class the native
// <select> did, so it looks identical; only the option list is now custom.

export type SelectOption = { value: string; label: ReactNode };

/** Flatten <option> children into the SelectOption[] the popover renders. */
function optionsFromChildren(children?: ReactNode): SelectOption[] {
  const list: SelectOption[] = [];
  const walk = (nodes?: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const el = child as ReactElement<{ value?: unknown; children?: ReactNode }>;
      if (el.type === 'option') {
        list.push({
          value: String(el.props.value ?? ''),
          label: (el.props.children ?? null) as ReactNode,
        });
      } else if (el.props && (el.props as { children?: ReactNode }).children) {
        walk((el.props as { children?: ReactNode }).children);
      }
    });
  };
  walk(children);
  return list;
}

export function AdminSelect({
  value,
  onChange,
  children,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  wrapperClassName = '',
  ariaLabel,
  noChevron = false,
}: {
  value?: string | number;
  onChange: (value: string) => void;
  /** <option value={...}>Label</option> elements. */
  children?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /** Applied to the trigger button so it matches the native select exactly. */
  className?: string;
  /** Optional class name on the outer wrapper relative div. */
  wrapperClassName?: string;
  ariaLabel?: string;
  /** Suppress the internal chevron when the caller renders its own (e.g. AI Studio pill). */
  noChevron?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const options = optionsFromChildren(children);
  const current = String(value ?? '');
  const selected = options.find(o => o.value === current);

  // Auto-detect layout constraints so wrapper flexes or sizes identically to native <select>
  const isFlex1 = className.includes('flex-1');
  const isFull = className.includes('w-full') || className.includes('adminInput');
  const maxWidthMatch = className.match(/\b(max-w-[^\s]+)/);
  const smWidthMatch = className.match(/\b(sm:w-[^\s]+)/);

  const wrapperLayout = [
    isFlex1 ? 'flex-1' : '',
    isFull && !isFlex1 ? 'w-full' : '',
    !isFull && !isFlex1 ? 'inline-block' : '',
    maxWidthMatch ? maxWidthMatch[1] : '',
    smWidthMatch ? smWidthMatch[1] : '',
    wrapperClassName,
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open]);

  const openList = () => {
    if (disabled) return;
    setHighlighted(Math.max(0, options.findIndex(o => o.value === current)));
    setOpen(o => !o);
  };

  const choose = (o: SelectOption) => {
    if (disabled) return;
    onChange(o.value);
    setOpen(false);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setHighlighted(Math.max(0, options.findIndex(o => o.value === current)));
        setOpen(true);
      } else if (highlighted >= 0 && options[highlighted]) {
        choose(options[highlighted]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setHighlighted(Math.max(0, options.findIndex(o => o.value === current)));
        setOpen(true);
      } else {
        setHighlighted(h => (h + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setHighlighted(h => (h - 1 + options.length) % options.length);
    }
  };

  const popoverWidth = isFull || isFlex1 ? 'w-full' : 'min-w-full w-max max-w-[calc(100vw-2rem)]';

  return (
    <div ref={rootRef} className={`relative ${wrapperLayout}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={openList}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`relative flex items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${isFull || isFlex1 ? 'w-full' : ''} ${className}`}
      >
        <span className={`truncate ${selected ? '' : 'text-surface-400'}`}>{selected ? selected.label : placeholder}</span>
        {!noChevron && <ChevronDown className={`h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className={`absolute left-0 top-full z-[100] mt-1.5 max-h-64 ${popoverWidth} overflow-auto rounded-xl border border-black/10 bg-white/95 p-1 shadow-xl backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-surface-900/95`}
        >
          {options.map((o, i) => {
            const isSelected = o.value === current;
            const isActive = i === highlighted;
            return (
              <button
                key={`${o.value}-${i}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => choose(o)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isActive ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'text-surface-700 dark:text-surface-200'
                } ${isSelected ? 'font-bold' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
              </button>
            );
          })}
          {options.length === 0 && <div className="px-2.5 py-2 text-xs text-surface-400">No options</div>}
        </div>
      )}
    </div>
  );
}

// ---- AdminCombobox ---------------------------------------------------------
// An editable text input with an interactive floating suggestions dropdown.
// Used for match targets/values (tags, tools, categories) in filter rails,
// creative directions, and section targets. Allows freely typing custom values
// while offering 1-click autocomplete from all existing taxonomy and presets.

export interface ComboboxOption {
  value: string;
  label: string;
  count?: number;
  hint?: string;
  type?: string;
}

export function AdminCombobox({
  value,
  onChange,
  options = [],
  placeholder = 'Type or select...',
  className = '',
  wrapperClassName = '',
  disabled = false,
  onSelectSuggestion,
  showAllOnFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<ComboboxOption | string>;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  onSelectSuggestion?: (item: ComboboxOption) => void;
  showAllOnFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: ComboboxOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const query = value.trim().toLowerCase();
  const filtered = query
    ? normalizedOptions.filter(o =>
        o.label.toLowerCase().includes(query) ||
        o.value.toLowerCase().includes(query)
      )
    : (showAllOnFocus ? normalizedOptions : []);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (item: ComboboxOption) => {
    onChange(item.value);
    if (onSelectSuggestion) onSelectSuggestion(item);
    setOpen(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlighted(0);
      } else {
        setHighlighted(prev => (prev + 1 < filtered.length ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) {
        setHighlighted(prev => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (open && highlighted >= 0 && filtered[highlighted]) {
        e.preventDefault();
        choose(filtered[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${wrapperClassName}`}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => {
          if (filtered.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className || adminInput}
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full z-[120] mt-1 max-h-60 w-full min-w-[220px] overflow-auto rounded-xl border border-black/10 bg-white/95 p-1 shadow-xl backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-surface-900/95"
        >
          {filtered.map((item, idx) => {
            const isSelected = item.value.toLowerCase() === value.trim().toLowerCase();
            const isHighlighted = idx === highlighted;
            return (
              <button
                key={`${item.value}-${idx}`}
                type="button"
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => choose(item)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isHighlighted
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                    : 'text-surface-700 dark:text-surface-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                } ${isSelected ? 'font-bold' : ''}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.value !== item.label && (
                    <span className="text-[10px] text-surface-400 font-mono">({item.value})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500 font-semibold">
                      {item.count}
                    </span>
                  )}
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary-500" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- AdminTagInput ---------------------------------------------------------
// Comma-separated tag/category textarea with intelligent autocomplete suggestions
// for the token currently being typed after the last comma.

export function AdminTagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'tag1, tag2...',
  rows = 2,
  className = '',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: Array<ComboboxOption | string>;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const normalized: ComboboxOption[] = suggestions.map(s =>
    typeof s === 'string' ? { value: s, label: s } : s
  );

  const parts = value.split(',');
  const currentToken = (parts[parts.length - 1] || '').trim().toLowerCase();

  const filtered = currentToken
    ? normalized.filter(s =>
        s.label.toLowerCase().includes(currentToken) ||
        s.value.toLowerCase().includes(currentToken)
      ).slice(0, 15)
    : [];

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, [open]);

  const insertToken = (item: ComboboxOption) => {
    const list = value.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length > 0 && currentToken) {
      list[list.length - 1] = item.value;
    } else {
      list.push(item.value);
    }
    onChange(list.join(', ') + ', ');
    setOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className={className || adminInput}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-[120] mt-1 max-h-48 w-full overflow-auto rounded-xl border border-black/10 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-surface-900/95">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-surface-400">
            Suggested matches:
          </div>
          {filtered.map((item, idx) => (
            <button
              key={`${item.value}-${idx}`}
              type="button"
              onClick={() => insertToken(item)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-surface-700 hover:bg-primary-500/10 hover:text-primary-600 dark:text-surface-200 dark:hover:text-primary-300 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{item.label}</span>
                {item.value !== item.label && (
                  <span className="text-[10px] text-surface-400 font-mono">({item.value})</span>
                )}
              </div>
              {item.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- PresetPills -----------------------------------------------------------
// Clickable pill chips for fast 1-click toggling of category presets or popular
// tags in post editors and filters.

export function PresetPills({
  title,
  items,
  selectedValues = [],
  onToggle,
  className = '',
  maxVisible = 20,
}: {
  title?: string;
  items: Array<{ value: string; label: string; count?: number }>;
  selectedValues?: string[];
  onToggle: (value: string, label: string) => void;
  className?: string;
  maxVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  if (!items || items.length === 0) return null;

  // Deduplicate items by normalized value so duplicate pills/keys never render
  const seen = new Set<string>();
  const uniqueItems = items.filter(item => {
    const key = (item.value || item.label || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const normalizedSelected = new Set(selectedValues.map(v => v.trim().toLowerCase()));
  const visibleItems = showAll ? uniqueItems : uniqueItems.slice(0, maxVisible);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {title && (
        <div className="flex items-center justify-between text-[11px] font-bold text-surface-500 dark:text-surface-400">
          <span>{title}</span>
          {uniqueItems.length > maxVisible && (
            <button
              type="button"
              onClick={() => setShowAll(s => !s)}
              className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
            >
              {showAll ? 'Show less' : `+${uniqueItems.length - maxVisible} more`}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {visibleItems.map((item, idx) => {
          const isSelected = normalizedSelected.has(item.value.toLowerCase()) || normalizedSelected.has(item.label.toLowerCase());
          return (
            <button
              key={`${item.value}-${idx}`}
              type="button"
              onClick={() => onToggle(item.value, item.label)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-sm ring-1 ring-primary-600'
                  : 'border border-black/[0.08] bg-white/70 text-surface-700 hover:bg-white hover:border-primary-300 dark:border-white/10 dark:bg-white/[0.05] dark:text-surface-300 dark:hover:bg-white/10'
              }`}
            >
              {isSelected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-surface-400" />}
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-normal ${
                  isSelected ? 'bg-primary-700 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

