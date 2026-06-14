export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, ImagePlus, Wand2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Prompt Guides | AI PromptMatrix',
  description: 'Simple guides for customizing AI image prompts, using reference images, and improving generated artwork.',
};

export default function GuidesPage() {
  const guides = [
    {
      title: 'How to customize an AI image prompt',
      text: 'Change the subject, outfit, colors, camera angle, and style notes while keeping the main prompt structure intact.',
      icon: Wand2,
    },
    {
      title: 'How to use reference images',
      text: 'Use references for identity, pose, clothing, or composition, and avoid mixing too many conflicting images.',
      icon: ImagePlus,
    },
    {
      title: 'How to keep prompts reusable',
      text: 'Write placeholders clearly so you can reuse the same prompt for different characters, products, or poster ideas.',
      icon: BookOpen,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Guides</p>
      <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">AI Prompt Guides</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
        Short guides for using AI PromptMatrix prompts more effectively.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {guides.map(guide => {
          const Icon = guide.icon;
          return (
            <article key={guide.title} className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-surface-950 dark:text-white">{guide.title}</h2>
              <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-400">{guide.text}</p>
            </article>
          );
        })}
      </div>

      <Link href="/explore" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-black text-white">
        Browse prompts <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
