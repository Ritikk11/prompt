'use client';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { RotateCcw, Wand2 } from 'lucide-react';
import { askAi, askAiJson, type AskAiOptions } from '@/lib/admin/ai';

interface MagicWandContextValue {
  loaders: Record<string, boolean>;
  undoStack: Record<string, string>;
  error: Record<string, string>;
  runWand: (fieldId: string, currentValue: string, setter: (val: string) => void, prompt: string, options?: AskAiOptions) => Promise<void>;
  runJsonWand: <T>(fieldId: string, currentJson: string, apply: (parsed: T) => void, restore: (json: string) => void, prompt: string, options?: Omit<AskAiOptions, 'json'>) => Promise<void>;
  undo: (fieldId: string) => void;
  registerRestore: (fieldId: string, restore: (val: string) => void) => void;
}

const MagicWandContext = createContext<MagicWandContextValue | null>(null);

export function MagicWandProvider({ children }: { children: ReactNode }) {
  const [loaders, setLoaders] = useState<Record<string, boolean>>({});
  const [undoStack, setUndoStack] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  // Restore callbacks are stored outside React state: they are functions and only
  // needed at undo time, never for rendering.
  const [restorers] = useState<Map<string, (val: string) => void>>(() => new Map());

  const registerRestore = useCallback((fieldId: string, restore: (val: string) => void) => {
    restorers.set(fieldId, restore);
  }, [restorers]);

  const setLoading = useCallback((fieldId: string, value: boolean) => {
    setLoaders(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const rememberOriginal = useCallback((fieldId: string, currentValue: string) => {
    // Keep the pre-AI original across repeated generations: only the first
    // generation records an undo value, so Undo always returns to human text.
    setUndoStack(prev => (prev[fieldId] !== undefined ? prev : { ...prev, [fieldId]: currentValue }));
  }, []);

  const runWand = useCallback(async (
    fieldId: string,
    currentValue: string,
    setter: (val: string) => void,
    prompt: string,
    options?: AskAiOptions,
  ) => {
    setError(prev => ({ ...prev, [fieldId]: '' }));
    setLoading(fieldId, true);
    try {
      const newText = await askAi(prompt, options);
      rememberOriginal(fieldId, currentValue);
      registerRestore(fieldId, setter);
      setter(newText);
    } catch (err: any) {
      setError(prev => ({ ...prev, [fieldId]: err?.message || 'Generation failed' }));
    } finally {
      setLoading(fieldId, false);
    }
  }, [rememberOriginal, registerRestore, setLoading]);

  const runJsonWand = useCallback(async function runJsonWand<T>(
    fieldId: string,
    currentJson: string,
    apply: (parsed: T) => void,
    restore: (json: string) => void,
    prompt: string,
    options?: Omit<AskAiOptions, 'json'>,
  ) {
    setError(prev => ({ ...prev, [fieldId]: '' }));
    setLoading(fieldId, true);
    try {
      const parsed = await askAiJson<T>(prompt, options);
      rememberOriginal(fieldId, currentJson);
      registerRestore(fieldId, restore);
      apply(parsed);
    } catch (err: any) {
      setError(prev => ({ ...prev, [fieldId]: err?.message || 'Generation failed' }));
    } finally {
      setLoading(fieldId, false);
    }
  }, [rememberOriginal, registerRestore, setLoading]);

  const undo = useCallback((fieldId: string) => {
    setUndoStack(prev => {
      if (prev[fieldId] === undefined) return prev;
      restorers.get(fieldId)?.(prev[fieldId]);
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, [restorers]);

  const value = useMemo(() => ({
    loaders, undoStack, error, runWand, runJsonWand, undo, registerRestore,
  }), [loaders, undoStack, error, runWand, runJsonWand, undo, registerRestore]);

  return <MagicWandContext.Provider value={value}>{children}</MagicWandContext.Provider>;
}

export function useMagicWand() {
  const ctx = useContext(MagicWandContext);
  if (!ctx) throw new Error('useMagicWand must be used inside MagicWandProvider');
  return ctx;
}

interface WandButtonProps {
  fieldId: string;
  value: string;
  onChange: (val: string) => void;
  prompt: string | (() => string);
  systemContext?: string;
  label?: string;
  size?: 'xs' | 'sm';
}

export function WandButton({ fieldId, value, onChange, prompt, systemContext, label = 'Auto-write', size = 'xs' }: WandButtonProps) {
  const { loaders, undoStack, error, runWand, undo } = useMagicWand();
  const [instruction, setInstruction] = useState('');
  const loading = !!loaders[fieldId];
  const canUndo = undoStack[fieldId] !== undefined;
  const sizing = size === 'xs'
    ? { btn: 'gap-1 rounded px-2 py-0.5 text-[10px]', icon: 'h-3 w-3' }
    : { btn: 'gap-1.5 rounded-xl px-3 py-2 text-xs', icon: 'h-3.5 w-3.5' };

  return (
    <span className="inline-flex items-center gap-2">
      {error[fieldId] && (
        <span className="max-w-[200px] truncate text-[10px] font-semibold text-rose-500" title={error[fieldId]}>
          AI failed — try again
        </span>
      )}
      {canUndo && (
        <button
          type="button"
          onClick={() => undo(fieldId)}
          className={`inline-flex items-center font-bold text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 ${sizing.btn}`}
        >
          <RotateCcw className={sizing.icon} /> Undo
        </button>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          const p = typeof prompt === 'function' ? prompt() : prompt;
          const pWithContext = value.trim() ? `${p}\n\nCURRENT FIELD VALUE (for context; if rewriting, use this as a starting point):\n${value.slice(0, 5000)}` : p;
          const finalPrompt = instruction.trim() ? `${pWithContext}\n\nSpecial User Instructions:\n${instruction}` : pWithContext;
          runWand(fieldId, value, onChange, finalPrompt, { systemContext });
        }}
        className={`inline-flex items-center font-bold bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-60 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 ${sizing.btn}`}
      >
        {loading
          ? <span className={`animate-spin rounded-full border-2 border-primary-500 border-t-transparent ${sizing.icon}`} />
          : <Wand2 className={sizing.icon} />}
        {label}
      </button>
      <input
        type="text"
        placeholder="Instructions..."
        value={instruction}
        onChange={e => setInstruction(e.target.value)}
        disabled={loading}
        className={`bg-transparent border border-surface-200 dark:border-surface-700 rounded px-2 outline-none focus:border-primary-500 w-20 sm:w-28 focus:w-40 transition-all font-normal text-surface-900 dark:text-surface-100 disabled:opacity-50 ${sizing.btn}`}
      />
    </span>
  );
}
