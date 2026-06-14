export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Prompt Blog | AI PromptMatrix',
  description: 'AI PromptMatrix blog notes about image models, prompt writing, references, and creative workflows.',
};

export default function BlogPage() {
  const posts = [
    {
      title: 'Which AI image model should you try first?',
      text: 'A quick way to decide between ChatGPT, Gemini, Grok, Qwen, and other generators based on the kind of visual you want.',
    },
    {
      title: 'Why prompt structure matters',
      text: 'A strong prompt usually separates subject, style, composition, lighting, and constraints instead of mixing everything together.',
    },
    {
      title: 'When to add more detail and when to stop',
      text: 'Long prompts can help complex outputs, but too many conflicting instructions can make results worse.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Blog</p>
      <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">AI Prompt Blog</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
        Notes and short articles about AI image prompts, model choices, and creative workflows.
      </p>

      <div className="mt-8 space-y-4">
        {posts.map(post => (
          <article key={post.title} className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
              <Newspaper className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-surface-950 dark:text-white">{post.title}</h2>
            <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-400">{post.text}</p>
          </article>
        ))}
      </div>

      <Link href="/explore" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-black text-white">
        Explore prompt library <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
