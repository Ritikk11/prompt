'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  eventName?: string;
}

export default function CopyButton({ text, eventName = 'prompt_copied' }: Props) {
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
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow border border-transparent ${
        copied
          ? 'bg-green-500 text-white shadow-green-500/20 copy-pulse'
          : 'border-white/80 bg-white/60 text-surface-600 backdrop-blur-xl hover:border-primary-400/60 hover:bg-white/80 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:text-white'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
