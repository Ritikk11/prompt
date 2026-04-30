'use client';
import { useState, useMemo } from 'react';
import CopyButton from '@/components/CopyButton';

interface Props {
  originalPrompt: string;
}

export default function TemplatePrompt({ originalPrompt }: Props) {
  // Find all instances of [variable_name]
  const variables = useMemo(() => {
    const regex = /\[([^\]]+)\]/g;
    const matches = Array.from(originalPrompt.matchAll(regex));
    // Unique variables only
    return Array.from(new Set(matches.map(m => m[1])));
  }, [originalPrompt]);

  const [values, setValues] = useState<Record<string, string>>({});

  // Replace variables with user values or keep bracketed original
  let generatedPrompt = originalPrompt;
  variables.forEach(v => {
    const val = values[v];
    const lookup = `[${v}]`;
    if (val && val.trim() !== '') {
      generatedPrompt = generatedPrompt.split(lookup).join(val);
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
        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-6 mb-6 border border-surface-200/50 dark:border-surface-700/50 group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
          <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono">
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
              className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-5 mb-4 border border-surface-200/50 dark:border-surface-700/50 group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
        <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono whitespace-pre-wrap">
          {generatedPrompt}
        </p>
      </div>
    </>
  );
}
