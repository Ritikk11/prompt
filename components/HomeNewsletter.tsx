'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';

export default function HomeNewsletter({ settings }: { settings?: SiteSettings }) {
  const content = settings?.homepageContent?.newsletter || {};
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Could not subscribe right now.');
      }
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not subscribe right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.18),transparent_30%),radial-gradient(circle_at_50%_82%,rgba(236,72,153,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.23),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.08),transparent_30%),radial-gradient(circle_at_50%_82%,rgba(236,72,153,0.18),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#7c3aed_0.7px,transparent_0.7px)] [background-size:18px_18px] dark:opacity-[0.1]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-100/80 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-violet-100">
          <Mail className="h-4 w-4" />
          {content.badge || 'Stay updated'}
        </div>
        <h2 className="text-3xl font-black tracking-normal sm:text-4xl">{content.title || 'Get Weekly Prompt Collections'}</h2>
        <p className="mt-4 text-sm leading-7 text-surface-600 dark:text-surface-300">
          {content.description || 'Subscribe to receive curated prompt packs for ChatGPT, Gemini, Grok, and Qwen.'}
        </p>
        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            placeholder={content.inputPlaceholder || 'Enter your email'}
            disabled={isSubmitting}
            className="min-h-12 flex-1 rounded-xl border border-surface-200 bg-white/80 px-5 text-sm text-surface-900 outline-none shadow-sm backdrop-blur-md placeholder:text-surface-400 focus:border-primary-300 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/60 dark:focus:border-white/40"
          />
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-6 text-sm font-bold text-white shadow-[0_16px_36px_rgba(168,85,247,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0">
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : (content.ctaLabel || 'Subscribe')}
          </button>
        </form>
        <p className={`mt-4 text-xs ${error ? 'text-red-500 dark:text-red-300' : 'text-surface-500 dark:text-white/70'}`}>
          {error || (submitted ? (content.successText || "Subscribed. You're on the list.") : (content.helperText || 'No spam. Unsubscribe anytime.'))}
        </p>
      </div>
    </section>
  );
}
