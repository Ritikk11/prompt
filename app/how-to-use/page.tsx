export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clipboard, ImagePlus, Sparkles, Wand2 } from 'lucide-react';
import { fetchPostSummaries } from '@/lib/data';
import { getPostPath } from '@/lib/sections';

export const metadata: Metadata = {
  title: 'How to Use AI Prompts | AI PromptMatrix',
  description: 'Learn how to copy, customize, and generate with AI PromptMatrix image prompts using ChatGPT, Gemini, Grok, Qwen, and other generators.',
};

export default async function HowToUsePage() {
  const posts = (await fetchPostSummaries()).filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private').slice(0, 3);
  const mainPost = posts[0];
  const mainImage = mainPost?.thumbnailUrl || mainPost?.images?.[0]?.url;

  const steps = [
    { title: 'Choose a prompt page', text: 'Start from an output style close to what you want instead of beginning with a blank chat.', icon: Sparkles },
    { title: 'Copy the prompt', text: 'Use the prompt copy button or copy the full collection when a page has multiple prompts.', icon: Clipboard },
    { title: 'Add references', text: 'Upload a reference image when identity, pose, outfit, or style accuracy matters.', icon: ImagePlus },
    { title: 'Customize details', text: 'Replace placeholders, names, colors, camera notes, and format instructions before generating.', icon: Wand2 },
    { title: 'Generate and refine', text: 'Paste into your chosen AI generator, review the result, then adjust only one or two details at a time.', icon: Check },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Quick workflow</p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-6xl">
            How to use AI PromptMatrix prompts.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
            Copy the prompt structure, customize only the details you need, add reference images when useful, and generate in your preferred AI image tool.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-black text-white">
              Browse prompts <ArrowRight className="h-4 w-4" />
            </Link>
            {mainPost && (
              <Link href={getPostPath(mainPost)} className="inline-flex items-center gap-2 rounded-full border border-surface-200 px-5 py-3 text-sm font-black text-surface-900 dark:border-surface-700 dark:text-white">
                View example
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-surface-200 bg-surface-50 p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="rounded-[24px] border border-surface-200 bg-white p-3 shadow-xl dark:border-surface-800 dark:bg-surface-950">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-bold text-surface-400">Prompt page screenshot</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[0.78fr_1fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-100 dark:bg-surface-800">
                {mainImage && <Image src={mainImage} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" referrerPolicy="no-referrer" />}
              </div>
              <div className="rounded-2xl bg-surface-100 p-4 dark:bg-surface-900">
                <div className="mb-4 h-3 w-24 rounded-full bg-primary-500/80" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-surface-300 dark:bg-surface-700" />
                  <div className="h-3 w-11/12 rounded-full bg-surface-300 dark:bg-surface-700" />
                  <div className="h-3 w-4/5 rounded-full bg-surface-300 dark:bg-surface-700" />
                  <div className="h-3 w-10/12 rounded-full bg-surface-300 dark:bg-surface-700" />
                </div>
                <div className="mt-5 inline-flex rounded-xl bg-primary-500 px-4 py-2 text-xs font-black text-white">Copy prompt</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-8 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-black text-surface-300">0{index + 1}</span>
              </div>
              <h2 className="text-sm font-black text-surface-950 dark:text-white">{step.title}</h2>
              <p className="mt-2 text-xs leading-6 text-surface-600 dark:text-surface-400">{step.text}</p>
            </div>
          );
        })}
      </section>

      {posts.length > 1 && (
        <section className="mt-12 rounded-[28px] border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900 sm:p-6">
          <div className="mb-5">
            <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Screenshots</p>
            <h2 className="text-2xl font-black text-surface-950 dark:text-white">Example prompts you can test</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map(post => (
              <Link key={post.id} href={getPostPath(post)} className="group rounded-3xl border border-surface-200 bg-surface-50 p-3 transition-all hover:-translate-y-0.5 dark:border-surface-800 dark:bg-surface-950">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-100 dark:bg-surface-800">
                  <Image src={post.thumbnailUrl || post.images?.[0]?.url || ''} alt="" fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-black text-surface-950 dark:text-white">{post.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
