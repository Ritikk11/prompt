'use client';

import { useState } from 'react';
import { Check, Copy, Heart, ImagePlus, Search, Workflow } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { GlmSectionHeader, glassCard, glassSurface } from './GlmSection';
import GlmReveal from './GlmReveal';

// Step tiles use the Google brand quad — the site's designated spot colors
// for step tiles (see globals.css @theme comment).
const steps = [
  {
    number: '01',
    title: 'Browse & Discover',
    text: 'Explore curated prompts organized by tool, style, mood, and use case. Find the right direction before you generate.',
    icon: Search,
    color: 'bg-gradient-to-br from-google-blue to-primary-700 text-white',
    checks: ['Filter by tool', 'Check trending prompts', 'Open curated collections'],
  },
  {
    number: '02',
    title: 'Copy the Prompt',
    text: 'Found the perfect prompt? Click the copy button to instantly copy it to your clipboard with model-specific notes.',
    icon: Copy,
    color: 'bg-gradient-to-br from-google-green to-[#188038] text-white',
    checks: ['One-click copy', 'Includes model notes', 'Collection copy when available'],
  },
  {
    number: '03',
    title: 'Paste & Generate',
    text: 'Open your preferred image tool, paste the prompt, attach reference images when needed, and adjust settings as needed.',
    icon: ImagePlus,
    color: 'bg-gradient-to-br from-google-yellow to-[#ea8600] text-white',
    checks: ['Works with major image tools', 'Adjust aspect ratios', 'Fine-tune prompt details'],
  },
  {
    number: '04',
    title: 'Create & Save',
    text: 'Generate the result, save prompts you want to revisit, and keep useful ideas ready for your next artwork.',
    icon: Heart,
    color: 'bg-gradient-to-br from-google-red to-[#c5221f] text-white',
    checks: ['Save favorite prompts', 'Share useful collections', 'Return from your profile'],
  },
];

export default function GlmHowItWorks({ settings }: { settings?: SiteSettings }) {
  const content = settings?.homepageContent?.howTo || {};
  const editableSteps = content.items?.length ? steps.map((step, index) => ({
    ...step,
    title: content.items?.[index]?.title || step.title,
    text: content.items?.[index]?.text || step.text,
    checks: content.items?.[index]?.checks?.length ? content.items[index].checks! : step.checks,
  })) : steps;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = editableSteps[activeIndex] || editableSteps[0];
  const ActiveIcon = active.icon;

  return (
    <section id="how-it-works" className="relative w-full px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <GlmReveal slide>
          <GlmSectionHeader
            icon={<Workflow className="h-4 w-4" />}
            badge={content.badge || 'How It Works'}
            title={content.title || 'Create better images in 4 simple steps'}
            accentWord="4 simple steps"
            description={content.description || 'From browsing prompts to generating finished artwork, this workflow keeps the process simple and repeatable.'}
          />
        </GlmReveal>

        {/* Mobile: full glass cards, no interaction needed */}
        <GlmReveal stagger className="space-y-4 lg:hidden">
          {editableSteps.map(step => {
            const Icon = step.icon;
            return (
              <div key={step.number} className={`${glassCard} p-5`}>
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${step.color} text-sm font-black shadow-lg`}>
                    {step.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-extrabold text-surface-950 dark:text-white">{step.title}</div>
                    <p className="mt-1.5 text-sm leading-6 text-surface-600 dark:text-surface-300">{step.text}</p>
                  </div>
                  <Icon className="mt-1 h-6 w-6 shrink-0 text-surface-400" />
                </div>
                <div className="mt-4 space-y-2.5">
                  {step.checks.map(check => (
                    <div key={check} className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/40 px-4 py-3 text-sm font-medium text-surface-700 dark:border-white/10 dark:bg-white/5 dark:text-surface-200">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      {check}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </GlmReveal>

        {/* Desktop: interactive step list + floating glass detail panel */}
        <div className="hidden gap-10 lg:grid lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <GlmReveal stagger className="space-y-4">
            {editableSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeIndex === index;
              return (
                <button
                  key={step.number}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  className={`group grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 rounded-2xl border p-5 text-left backdrop-blur-md backdrop-saturate-[115%] transition ${
                    isActive
                      ? 'border-primary-500/70 bg-primary-500/10 shadow-[0_16px_44px_rgba(26,115,232,0.16)]'
                      : 'border-white/70 bg-white/40 hover:border-primary-400/60 hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-primary-400/50 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${step.color} text-sm font-black shadow-lg`}>
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
          </GlmReveal>

          <GlmReveal delay={120} className="relative min-h-[420px]">
            <div className="absolute inset-0 rounded-full bg-primary-400/25 blur-3xl dark:bg-primary-500/20" />
            <div className={`${glassSurface} relative mx-auto max-w-md rounded-[28px] p-8 shadow-[0_34px_90px_rgba(15,45,99,0.18)] dark:shadow-[0_34px_90px_rgba(0,0,0,0.4)]`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${active.color} shadow-lg`}>
                <ActiveIcon className="h-7 w-7" />
              </div>
              <div className="mt-5 text-sm font-bold uppercase tracking-wider text-primary-600 dark:text-primary-300">Step {active.number}</div>
              <h3 className="mt-1 text-2xl font-extrabold text-surface-950 dark:text-white">{active.title}</h3>
              <p className="mt-5 text-base leading-7 text-surface-600 dark:text-surface-300">{active.text}</p>
              <div className="mt-7 space-y-3">
                {active.checks.map(check => (
                  <div key={check} className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/40 px-4 py-3 text-sm font-medium text-surface-700 dark:border-white/10 dark:bg-white/5 dark:text-surface-200">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {check}
                  </div>
                ))}
              </div>
            </div>
          </GlmReveal>
        </div>
      </div>
    </section>
  );
}
