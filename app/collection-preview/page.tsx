import type { Metadata } from 'next';
import CopyButton from '@/components/CopyButton';
import { LoadingImg } from '@/components/LoadingImage';
import { getPromptImageUrl } from '@/lib/image-url';

// PREVIEW ONLY — a static mock of the "collection / article" post format so the
// layout can be reviewed before the data model + admin editor are built. Not
// linked anywhere and set to noindex. Delete once the real feature ships.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const UP = 'https://uploads.aipromptmatrix.in/prompts/';
const img = (file: string, width = 1024) => getPromptImageUrl(`${UP}${file}`, { width, quality: 78 });

type Item = { file: string; ratio: number; prompt: string; model: string };
type Entry = { heading: string; description: string; source?: string; items: Item[] };

const collection: { title: string; intro: string; thumb: string; entries: Entry[] } = {
  title: '10 Dreamy Radha Ashtami Portrait Prompts',
  intro:
    'A hand-picked set of devotional Radha-inspired portrait prompts — pastel lehengas, jasmine braids and soft temple light. Copy any prompt below and drop it straight into ChatGPT or Gemini.',
  thumb: 'radha-ashtami-floral-palace-portrait-mu7d4qqrf9b2.webp',
  entries: [
    {
      heading: 'Floral Palace Portrait',
      description:
        'The cover look: a garden-palace backdrop with hanging florals and warm evening lamps. Best on a 2:3 portrait frame so the lehenga and jewellery keep their detail.',
      items: [
        {
          file: 'radha-ashtami-floral-palace-portrait-mu7d4qqrf9b2.webp',
          ratio: 0.667,
          model: 'GPT Image 2',
          prompt:
            'Create a dreamy, cinematic Radha-inspired Indian devotional portrait of a young woman in a pastel peach lehenga with intricate floral embroidery, a sheer dupatta over her head, jasmine flowers in her hair, soft temple light and a floral palace-garden backdrop. 2:3 portrait, ultra-detailed.',
        },
      ],
    },
    {
      heading: 'Dreamy Radha-Inspired Floral (two looks)',
      description:
        'A single subject shot two ways — a soft daylight version and a moodier lamp-lit one. Pulled in from a published post that had both prompts, so both are shown here.',
      items: [
        {
          file: 'dreamy-radha-inspired-floral-portrait-mu7cqm4330o0.webp',
          ratio: 0.5625,
          model: 'Nano Banana 2',
          prompt:
            'Dreamy Radha-inspired devotional portrait, elegant pastel lehenga, floral jewellery, jasmine flowers, soft diffused temple light, peaceful expression, cinematic pastel colour grade, 2:3 portrait.',
        },
        {
          file: 'dreamy-radha-inspired-floral-portrait-mu7e7qfx4tuf.webp',
          ratio: 0.5625,
          model: 'Nano Banana 2',
          prompt:
            'Same Radha-inspired subject, evening lamp-lit variation — warm golden glow, deeper shadows, glowing diyas around her, richer jewel tones, cinematic bokeh, 2:3 portrait.',
        },
      ],
    },
  ],
};

export default function CollectionPreview() {
  const totalPrompts = collection.entries.reduce((n, e) => n + e.items.length, 0);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-300">
        Collection
      </span>
      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-surface-950 dark:text-white sm:text-5xl">
        {collection.title}
      </h1>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-surface-500 dark:text-surface-400">
        <span>{collection.entries.length} looks</span>
        <span aria-hidden>·</span>
        <span>{totalPrompts} prompts</span>
        <span aria-hidden>·</span>
        <span>Curated collection</span>
      </div>

      <div
        className="relative mt-6 w-full overflow-hidden rounded-3xl border border-white/60 bg-white/25 shadow-xl backdrop-blur-md backdrop-saturate-150 dark:border-white/10"
        style={{ aspectRatio: '16 / 10' }}
      >
        <LoadingImg
          src={img(collection.thumb, 1120)}
          alt={collection.title}
          priority
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <p className="mt-6 text-base leading-relaxed text-surface-600 dark:text-surface-300 sm:text-lg">
        {collection.intro}
      </p>

      <hr className="my-10 border-black/[0.06] dark:border-white/10" />

      {/* Entries — blog-style vertical flow */}
      <div className="space-y-14">
        {collection.entries.map((entry, i) => (
          <section key={entry.heading} className="scroll-mt-20">
            <div className="mb-3 flex items-baseline gap-3">
              <span className="text-lg font-black text-primary-500">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="text-xl font-black tracking-tight text-surface-950 dark:text-white sm:text-2xl">
                {entry.heading}
              </h2>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-surface-600 dark:text-surface-300 sm:text-base">
              {entry.description}
            </p>

            <div className="space-y-6">
              {entry.items.map((item, j) => (
                <div
                  key={item.file + j}
                  className="overflow-hidden rounded-3xl border border-white/60 bg-white/25 shadow-lg backdrop-blur-md backdrop-saturate-150 dark:border-white/10"
                >
                  <LoadingImg
                    src={img(item.file, 1024)}
                    alt={`${entry.heading} prompt ${j + 1}`}
                    aspectRatio={item.ratio}
                    className="block h-auto w-full"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                        Model: <span className="text-surface-800 dark:text-surface-200">{item.model}</span>
                      </span>
                      <CopyButton text={item.prompt} />
                    </div>
                    <div className="rounded-2xl border border-primary-500/20 bg-primary-50/25 p-4 dark:border-primary-400/20 dark:bg-primary-950/25">
                      <p className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-surface-800 dark:text-surface-200 sm:text-sm">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

