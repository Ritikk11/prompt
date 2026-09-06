'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  eventName?: string;
  className?: string;
}

export default function CopyButton({ text, eventName = 'prompt_copied', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', eventName);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', eventName);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy prompt to clipboard'}
      className={`group/copy inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm border select-none cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${
        copied
          ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/25 copy-pulse'
          : 'border-white/80 bg-white/70 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-primary-400/80 hover:bg-white hover:text-primary-600 hover:shadow-md hover:shadow-primary-500/10 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:border-primary-400/60 dark:hover:bg-primary-500/20 dark:hover:text-primary-300 dark:hover:shadow-primary-500/20'
      } ${className}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-white transition-transform duration-200 scale-110" />
      ) : (
        <Copy className="w-3.5 h-3.5 transition-transform duration-200 group-hover/copy:scale-110 group-hover/copy:rotate-[-6deg]" />
      )}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}
