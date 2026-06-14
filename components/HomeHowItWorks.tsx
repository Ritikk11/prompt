import Link from 'next/link';
import { ArrowRight, Check, Copy, ImagePlus, Search, Sparkles, Wand2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Browse a real prompt set',
    text: 'Find a prompt by visual style, model, subject, or use case instead of digging through random posts.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Copy the exact structure',
    text: 'Use the prompt as written, or copy a full collection when a post includes multiple variations.',
    icon: Copy,
  },
  {
    number: '03',
    title: 'Add your image or details',
    text: 'Replace placeholders, upload a reference image when needed, and keep the useful prompt shape intact.',
    icon: ImagePlus,
  },
  {
    number: '04',
    title: 'Generate and refine',
    text: 'Open your AI tool, paste the prompt, then adjust the final details until the result fits your idea.',
    icon: Wand2,
  },
];

export default function HomeHowItWorks() {
  const active = steps[0];
  const ActiveIcon = active.icon;

  return (
    <section id="how-it-works" className="relative overflow-hidden rounded-[28px] border border-surface-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-surface-800 dark:bg-surface-950/60 sm:p-8 lg:p-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent" />
      <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-500/25 dark:bg-primary-500/10 dark:text-primary-200">
            <Sparkles className="h-3.5 w-3.5" />
            How it works
          </div>
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white sm:text-4xl">
            Turn a saved prompt into a usable image workflow.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
            AI PromptMatrix is built around ready-to-use prompt collections: inspect the example, copy the prompt, adapt the placeholders, and send it to your preferred image model.
          </p>

          <div className="mt-8 space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === 0;
              return (
                <div
                  key={step.number}
                  className={`group grid grid-cols-[auto_1fr_auto] items-start gap-4 rounded-2xl border p-4 transition ${
                    isActive
                      ? 'border-primary-400 bg-primary-50/80 shadow-[0_14px_40px_rgba(99,102,241,0.14)] dark:border-primary-500/60 dark:bg-primary-500/10'
                      : 'border-surface-200 bg-surface-50/70 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900/70 dark:hover:border-primary-500/50'
                  }`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white ${isActive ? 'bg-gradient-to-br from-primary-500 to-fuchsia-500' : 'bg-surface-900 dark:bg-surface-700'}`}>
                    {step.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary-500" />
                      <h3 className="text-base font-bold text-surface-950 dark:text-white">{step.title}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-surface-600 dark:text-surface-300">{step.text}</p>
                  </div>
                  <ArrowRight className={`mt-1 h-4 w-4 ${isActive ? 'text-primary-500' : 'text-surface-400'}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-primary-500/20 via-fuchsia-400/10 to-cyan-400/10 blur-3xl" />
          <div className="relative rounded-[28px] border border-surface-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.16)] dark:border-surface-800 dark:bg-surface-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-fuchsia-500 text-white">
              <ActiveIcon className="h-7 w-7" />
            </div>
            <div className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary-500">Step {active.number}</div>
            <h3 className="mt-2 text-2xl font-extrabold text-surface-950 dark:text-white">{active.title}</h3>
            <p className="mt-4 text-base leading-7 text-surface-600 dark:text-surface-300">{active.text}</p>

            <div className="mt-7 space-y-3">
              {['Open a curated prompt collection', 'Check the model and image example', 'Use the copy or try button'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 dark:bg-surface-950/70 dark:text-surface-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Check className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/explore"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-surface-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary-600 dark:bg-white dark:text-surface-950 dark:hover:bg-primary-100"
            >
              Browse prompts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
