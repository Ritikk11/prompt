import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, SearchCheck, ShieldCheck } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { accentGradient, glassCard } from './GlmSection';
import GlmReveal from './GlmReveal';

const reviewSteps = [
  {
    number: '01',
    title: 'Submission check',
    text: 'Prompts are checked for a clear title, useful example image, model label, and complete prompt text before publishing.',
    icon: FileCheck2,
  },
  {
    number: '02',
    title: 'Prompt quality pass',
    text: 'We look for prompts that are reusable, specific enough to help creators, and organized with the right tools, categories, and tags.',
    icon: SearchCheck,
  },
  {
    number: '03',
    title: 'Safety and clarity',
    text: 'Public posts should avoid misleading claims, unsafe instructions, broken images, and confusing placeholders.',
    icon: ShieldCheck,
  },
  {
    number: '04',
    title: 'Publish and improve',
    text: 'Approved prompts can be updated later with better descriptions, FAQs, model notes, and richer usage guidance.',
    icon: CheckCircle2,
  },
];

export default function GlmReviewProcess({ settings }: { settings?: SiteSettings }) {
  const content = settings?.homepageContent?.reviewProcess || {};
  const editableSteps = content.items?.length ? reviewSteps.map((step, index) => ({
    ...step,
    title: content.items?.[index]?.title || step.title,
    text: content.items?.[index]?.text || step.text,
  })) : reviewSteps;

  // Same title treatment as GlmSectionHeader: Playfair-italic gradient accent
  // on the word "reviewed".
  const title = content.title || 'How prompts are reviewed before they go live';
  const accentWord = 'reviewed';
  const accentIndex = title.toLowerCase().indexOf(accentWord);
  const titleNode = accentIndex >= 0 ? (
    <>
      {title.slice(0, accentIndex)}
      <span className={`font-serif-italic font-bold px-1 ${accentGradient}`}>
        {title.slice(accentIndex, accentIndex + accentWord.length)}
      </span>
      {title.slice(accentIndex + accentWord.length)}
    </>
  ) : title;

  return (
    <section className="relative w-full overflow-clip px-5 py-16 sm:px-8">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" />
      {/* Same layout as main: heading column beside the 2x2 step cards (the
          previous "Quality you can trust" card was a /test invention that
          stacked awkwardly on mobile and diverged from main's heading). */}
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        {/* Left: badge, title, description, CTA — plain text column like main */}
        <GlmReveal slide>
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/[0.14] dark:text-primary-200">
              <ShieldCheck className="h-4 w-4" />
              {content.badge || 'Review process'}
            </div>
            <h2 className="max-w-xl text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white sm:text-4xl">
              {titleNode}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-surface-600 dark:text-surface-300">
              {content.description || 'Every public prompt is checked for clarity, useful examples, model context, and clean organization before it appears in the library.'}
            </p>
            {content.showCta !== false && (
              <Link
                href={content.ctaHref || '/submit'}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4285f4] to-[#1a73e8] px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary-500/25 transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary-500/40 hover:brightness-[1.06] active:scale-95"
              >
                {content.ctaLabel || 'Submit a prompt'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </GlmReveal>

          {/* Right: 2x2 glass step cards */}
          <GlmReveal stagger delay={150} className="grid gap-4 sm:grid-cols-2">
            {editableSteps.map(step => {
              const Icon = step.icon;
              return (
                <div key={step.number} className={`${glassCard} p-5 transition hover:border-primary-400/60 dark:hover:border-primary-400/50`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black tracking-[0.2em] text-primary-600 dark:text-primary-300">{step.number}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-surface-950 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">{step.text}</p>
                </div>
              );
            })}
          </GlmReveal>
      </div>
    </section>
  );
}
