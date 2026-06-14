'use client';

import { useState } from 'react';
import { Check, Copy, Heart, ImagePlus, Search, Wand2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Browse & Discover',
    text: 'Explore curated AI prompts organized by tool, style, mood, and use case. Find the right direction before you generate.',
    icon: Search,
    color: 'from-violet-500 to-violet-600',
    checks: ['Filter by AI tool', 'Check trending prompts', 'Open curated collections'],
  },
  {
    number: '02',
    title: 'Copy the Prompt',
    text: 'Found the perfect prompt? Click the copy button to instantly copy it to your clipboard with model-specific notes.',
    icon: Copy,
    color: 'from-blue-500 to-blue-600',
    checks: ['One-click copy', 'Includes model notes', 'Collection copy when available'],
  },
  {
    number: '03',
    title: 'Paste & Generate',
    text: 'Open your preferred AI tool, paste the prompt, attach reference images when needed, and adjust settings as needed.',
    icon: Wand2,
    color: 'from-emerald-500 to-emerald-600',
    checks: ['Works with major image tools', 'Adjust aspect ratios', 'Fine-tune prompt details'],
  },
  {
    number: '04',
    title: 'Create & Save',
    text: 'Generate the result, save prompts you want to revisit, and keep useful ideas ready for your next artwork.',
    icon: Heart,
    color: 'from-orange-500 to-orange-600',
    checks: ['Save favorite prompts', 'Share useful collections', 'Return from your profile'],
  },
];

export default function HomeHowItWorks() {
  const [activeIndex, setActiveIndex] = useState(1);
  const active = steps[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <section id="how-it-works" className="relative overflow-hidden rounded-[30px] border border-surface-200 bg-white px-4 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-surface-800 dark:bg-surface-950/80 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-bold text-primary-700">
            <Wand2 className="h-4 w-4" />
            How It Works
          </div>
          <h2 className="text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white sm:text-4xl">
            Create better AI images in 4 simple steps
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
            From browsing prompts to generating finished artwork, this workflow keeps the process simple and repeatable.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeIndex === index;

              return (
                <button
                  key={step.number}
                  type="button"
                  data-home-how-step={step.number}
                  onClick={() => setActiveIndex(index)}
                  className={`group grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 rounded-2xl border p-5 text-left transition ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 shadow-[0_16px_44px_rgba(124,58,237,0.13)] dark:bg-primary-500/10 dark:shadow-[0_18px_52px_rgba(124,58,237,0.16)]'
                      : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:border-surface-800 dark:bg-surface-900/70 dark:hover:border-primary-500/60 dark:hover:bg-primary-500/10'
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} text-sm font-black text-white shadow-lg`}>
                    {step.number}
                  </span>
                  <span>
                    <span className="block text-lg font-extrabold text-surface-950 dark:text-white">{step.title}</span>
                    <span className="mt-1.5 block text-sm leading-6 text-surface-600 dark:text-surface-300">{step.text}</span>
                  </span>
                  <Icon className={`mt-1 h-6 w-6 ${isActive ? 'text-primary-500' : 'text-surface-400 group-hover:text-primary-500'}`} />
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[420px]">
            <div className="absolute inset-0 rounded-full bg-primary-300/25 blur-3xl dark:bg-primary-500/20" />
            <div className="relative mx-auto max-w-md rounded-[28px] border border-transparent bg-white p-8 shadow-[0_34px_90px_rgba(83,54,118,0.22)] dark:border-surface-800 dark:bg-surface-900 dark:shadow-[0_34px_90px_rgba(0,0,0,0.35)]">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${active.color} text-white shadow-lg`}>
                <ActiveIcon className="h-7 w-7" />
              </div>
              <div className="mt-5 text-sm font-medium text-surface-500 dark:text-surface-400">Step {active.number}</div>
              <h3 className="mt-1 text-2xl font-extrabold text-surface-950 dark:text-white">{active.title}</h3>
              <p className="mt-5 text-base leading-7 text-surface-600 dark:text-surface-300">{active.text}</p>

              <div className="mt-7 space-y-3">
                {active.checks.map(check => (
                  <div key={check} className="flex items-center gap-3 rounded-xl bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 dark:bg-surface-950/70 dark:text-surface-200">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {check}
                  </div>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-5 -left-4 hidden h-24 w-24 rounded-3xl border border-primary-100 bg-primary-50/80 p-5 text-primary-500 shadow-xl dark:border-primary-500/20 dark:bg-primary-500/10 lg:block">
              <ImagePlus className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
