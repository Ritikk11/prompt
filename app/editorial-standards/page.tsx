export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ClipboardCheck, Eye, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Editorial Standards | AI PromptMatrix',
  description: 'How AI PromptMatrix reviews prompt pages, examples, model notes, comments, and user submissions before publication.',
};

export default function EditorialStandardsPage() {
  const steps = [
    {
      title: 'Submission',
      text: 'A prompt page should include a clear title, example image, intended model, useful tags, and enough context for someone else to use it.',
      icon: ClipboardCheck,
    },
    {
      title: 'Review',
      text: 'Posts are checked for broken images, empty prompts, confusing model labels, unsafe wording, and misleading titles before they are featured.',
      icon: Eye,
    },
    {
      title: 'Quality pass',
      text: 'Descriptions, how-to steps, templates, and optional FAQs should help the page feel useful instead of thin or repetitive.',
      icon: BadgeCheck,
    },
    {
      title: 'Publish and monitor',
      text: 'Comments and public submissions can require approval, and posts can be updated when models, examples, or instructions need improvement.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <section className="rounded-[32px] border border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900 sm:p-8 lg:p-10">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Editorial Standards</p>
        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-6xl">
          How a prompt gets onto AI PromptMatrix.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-surface-600 dark:text-surface-400">
          This page explains the quality rules behind the library: clear examples, honest model labels, working copy controls, useful descriptions, and moderation for public activity.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-black text-primary-500">0{index + 1}</span>
                <Icon className="h-5 w-5 text-primary-500" />
              </div>
              <h2 className="text-lg font-black text-surface-950 dark:text-white">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-400">{step.text}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[28px] border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
          <h2 className="text-2xl font-black text-surface-950 dark:text-white">What “reviewed” means here</h2>
          <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-400">
            A reviewed prompt is not a guarantee that every generation will be perfect. It means the page has been checked for basic usefulness: visible output, copyable prompt text, sensible model notes, clean formatting, and no obvious broken controls.
          </p>
        </div>
        <div className="rounded-[28px] border border-primary-500/20 bg-primary-500 p-6 text-white shadow-lg shadow-primary-500/20">
          <h2 className="text-2xl font-black">Want to submit?</h2>
          <p className="mt-3 text-sm leading-7 text-white/80">Public submissions can be enabled from admin settings and reviewed before they appear live.</p>
          <Link href="/submit" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-surface-950">
            Submit prompt <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
