'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';

export default function HomeNewsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      localStorage.setItem('aipm-newsletter-email', email.trim());
    } catch {}
    setSubmitted(true);
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-700 px-5 py-16 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.16),transparent_36%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold backdrop-blur-md">
          <Mail className="h-4 w-4" />
          Stay updated
        </div>
        <h2 className="text-3xl font-black tracking-normal sm:text-4xl">Get Weekly Prompt Collections</h2>
        <p className="mt-4 text-sm leading-7 text-white/84">
          Subscribe to receive curated prompt packs for ChatGPT, Gemini, Grok, and Qwen.
        </p>
        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="min-h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-5 text-sm text-white placeholder:text-white/70 outline-none backdrop-blur-md focus:border-white/50"
          />
          <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-primary-700 transition hover:-translate-y-0.5">
            <Send className="h-4 w-4" />
            Subscribe
          </button>
        </form>
        <p className="mt-4 text-xs text-white/75">{submitted ? 'Saved. Email provider connection can be added later.' : 'No spam. Unsubscribe anytime once email delivery is connected.'}</p>
      </div>
    </section>
  );
}
