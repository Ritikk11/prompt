'use client';
import { useState, useMemo } from 'react';
import CopyButton from '@/components/CopyButton';

interface Props {
  originalPrompt: string;
}

export default function TemplatePrompt({ originalPrompt }: Props) {
  const variables = useMemo(() => {
    const regex = /(?:\[([^\]]+)\]|\{([^}]+)\})/g;
    const matches = Array.from(originalPrompt.matchAll(regex));
    return Array.from(new Set(matches.map(m => (m[1] || m[2]).trim()).filter(Boolean)));
  }, [originalPrompt]);

  const [values, setValues] = useState<Record<string, string>>({});

  // Replace variables with user values or keep bracketed original
  let generatedPrompt = originalPrompt;
  variables.forEach(v => {
    const val = values[v];
    if (val && val.trim() !== '') {
      generatedPrompt = generatedPrompt
        .split(`[${v}]`).join(val)
        .split(`{${v}}`).join(val);
    }
  });

  if (variables.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
            <h3 className="font-bold text-base tracking-tight">Prompt</h3>
          </div>
          <CopyButton text={originalPrompt} />
        </div>
        <div className="rounded-2xl border border-primary-500/20 bg-primary-50/25 p-5 mb-6 group-hover:bg-primary-50/40 dark:border-primary-400/20 dark:bg-primary-950/25 dark:group-hover:bg-primary-900/30 transition-colors">
          <p className="text-sm md:text-base leading-relaxed text-surface-800 dark:text-surface-200 font-mono selection:bg-primary-500/20">
            {originalPrompt}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
          <h3 className="font-bold text-base tracking-tight">Smart Template</h3>
        </div>
        <CopyButton text={generatedPrompt} />
      </div>
      <p className="mb-4 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
        Fill the placeholders you want to customize. The prompt below updates instantly, and Copy uses your filled version.
      </p>
      
      {/* Inputs */}
      <div className="mb-4 space-y-3">
        {variables.map(v => (
          <div key={v} className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">{v}</label>
            <input
              type="text"
              placeholder={`Enter ${v}...`}
              value={values[v] || ''}
              onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/25 dark:bg-white/5 border border-white/80 dark:border-white/10 outline-none focus:border-primary-500 text-sm transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="no-scrollbar max-h-[360px] overflow-y-auto rounded-2xl border border-primary-500/20 bg-primary-50/25 p-5 mb-4 group-hover:bg-primary-50/40 dark:border-primary-400/20 dark:bg-primary-950/25 dark:group-hover:bg-primary-900/30 transition-colors">
        <p className="text-sm md:text-base leading-relaxed text-surface-800 dark:text-surface-200 font-mono whitespace-pre-wrap selection:bg-primary-500/20">
          {generatedPrompt}
        </p>
      </div>
    </>
  );
}
