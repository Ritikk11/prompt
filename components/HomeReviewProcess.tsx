import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, SearchCheck, ShieldCheck } from 'lucide-react';

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

export default function HomeReviewProcess() {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-surface-50 px-5 py-16 dark:bg-surface-950 sm:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Review process
          </div>
          <h2 className="max-w-xl text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white sm:text-4xl">
            How prompts are reviewed before they go live
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-surface-600 dark:text-surface-300">
            Every public prompt is checked for clarity, useful examples, model context, and clean organization before it appears in the library.
          </p>
          <Link
            href="/submit"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-surface-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary-600 dark:bg-white dark:text-surface-950 dark:hover:bg-primary-100"
          >
            Submit a prompt
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {reviewSteps.map(step => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="rounded-2xl border border-surface-200 bg-surface-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-surface-800 dark:bg-surface-900/70 dark:hover:border-emerald-500/50">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black tracking-[0.2em] text-emerald-500">{step.number}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-surface-950 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">{step.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
