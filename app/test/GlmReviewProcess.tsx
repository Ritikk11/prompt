import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, SearchCheck, ShieldCheck } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { GlmSectionHeader, glassCard } from './GlmSection';
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

  return (
    <section className="relative w-full overflow-clip px-5 py-16 sm:px-8">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <GlmReveal slide>
          <GlmSectionHeader
            icon={<ShieldCheck className="h-4 w-4" />}
            badge={content.badge || 'Review process'}
            title={content.title || 'How prompts are reviewed before they go live'}
            accentWord="reviewed"
            description={content.description || 'Every public prompt is checked for clarity, useful examples, model context, and clean organization before it appears in the library.'}
          />
        </GlmReveal>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left: trust summary card */}
          <GlmReveal delay={100}>
            <div className={`${glassCard} p-8`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-google-blue to-primary-700 text-white shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-surface-950 dark:text-white">Quality you can trust</h3>
            <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-300">
              {content.description || 'Every public prompt is checked for clarity, useful examples, model context, and clean organization before it appears in the library.'}
            </p>
            {content.showCta !== false && (
              <Link
                href={content.ctaHref || '/submit'}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:scale-105 hover:bg-primary-700 active:scale-95 dark:bg-primary-500 dark:hover:bg-primary-600"
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
      </div>
    </section>
  );
}
