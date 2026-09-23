'use client';
import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';

// A few common aliases -> highlight.js language ids.
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', sh: 'bash', shell: 'bash', zsh: 'bash',
  yml: 'yaml', md: 'markdown', html: 'xml', htm: 'xml',
};

// Small copy button island — used by callouts (and anywhere prose needs a
// clipboard action) so the surrounding markdown can render on the server.
export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-current/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-white/50 dark:hover:bg-white/10 ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// Highlighted, copyable code block. highlight.js is dynamically imported inside
// an effect so it only ships in the browser bundle — never the SSR worker
// bundle (which must stay under Cloudflare's 3 MiB limit). JSON is pretty-printed
// before highlighting.
export function CodeBlock({ raw, lang }: { raw: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  const language = LANG_ALIASES[lang] || lang;

  let code = raw.replace(/\n$/, '');
  let effectiveLang = language;
  if (language === 'json' || (!language && /^[\s]*[{[]/.test(code))) {
    try {
      code = JSON.stringify(JSON.parse(code), null, 2);
      effectiveLang = 'json';
    } catch {
      /* leave as-is if not valid JSON */
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const hljs = (await import('highlight.js/lib/core')).default;
        const langs: Record<string, () => Promise<any>> = {
          javascript: () => import('highlight.js/lib/languages/javascript'),
          typescript: () => import('highlight.js/lib/languages/typescript'),
          python: () => import('highlight.js/lib/languages/python'),
          json: () => import('highlight.js/lib/languages/json'),
          bash: () => import('highlight.js/lib/languages/bash'),
          xml: () => import('highlight.js/lib/languages/xml'),
          css: () => import('highlight.js/lib/languages/css'),
          markdown: () => import('highlight.js/lib/languages/markdown'),
          sql: () => import('highlight.js/lib/languages/sql'),
        };
        await Promise.all(
          Object.entries(langs).map(async ([name, load]) => {
            if (!hljs.getLanguage(name)) hljs.registerLanguage(name, (await load()).default);
          })
        );
        const result = effectiveLang && hljs.getLanguage(effectiveLang)
          ? hljs.highlight(code, { language: effectiveLang })
          : hljs.highlightAuto(code);
        if (active) setHtml(result.value);
      } catch {
        if (active) setHtml(null);
      }
    })();
    return () => { active = false; };
  }, [code, effectiveLang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group my-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] shadow-inner">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-surface-400">
          {effectiveLang || 'code'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-surface-400 transition-colors hover:bg-white/10 hover:text-surface-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-surface-100">
        {html !== null
          ? <code className={`hljs ${effectiveLang ? `language-${effectiveLang}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
          : <code className="hljs">{code}</code>}
      </pre>
    </div>
  );
}
