import { ArrowRight, ImageIcon, Layers, Search, Sparkles, Tag, Wand2 } from 'lucide-react';
import type { HomeLinkBlock } from '@/lib/types';
import SmartLink from '@/components/SmartLink';

const iconMap = {
  sparkles: Sparkles,
  image: ImageIcon,
  wand: Wand2,
  layers: Layers,
  search: Search,
  tag: Tag,
};

const accentMap = {
  violet: {
    soft: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25',
    solid: 'bg-violet-500 text-white shadow-violet-500/20',
    line: 'bg-violet-500',
    border: 'hover:border-violet-300 dark:hover:border-violet-500/50',
    text: 'group-hover:text-violet-700 dark:group-hover:text-violet-200',
  },
  cyan: {
    soft: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/25',
    solid: 'bg-cyan-500 text-white shadow-cyan-500/20',
    line: 'bg-cyan-500',
    border: 'hover:border-cyan-300 dark:hover:border-cyan-500/50',
    text: 'group-hover:text-cyan-700 dark:group-hover:text-cyan-200',
  },
  emerald: {
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/25',
    solid: 'bg-emerald-500 text-white shadow-emerald-500/20',
    line: 'bg-emerald-500',
    border: 'hover:border-emerald-300 dark:hover:border-emerald-500/50',
    text: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-200',
  },
  amber: {
    soft: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25',
    solid: 'bg-amber-500 text-white shadow-amber-500/20',
    line: 'bg-amber-500',
    border: 'hover:border-amber-300 dark:hover:border-amber-500/50',
    text: 'group-hover:text-amber-700 dark:group-hover:text-amber-200',
  },
  rose: {
    soft: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/25',
    solid: 'bg-rose-500 text-white shadow-rose-500/20',
    line: 'bg-rose-500',
    border: 'hover:border-rose-300 dark:hover:border-rose-500/50',
    text: 'group-hover:text-rose-700 dark:group-hover:text-rose-200',
  },
  slate: {
    soft: 'bg-surface-100 text-surface-800 ring-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:ring-surface-700',
    solid: 'bg-surface-900 text-white shadow-surface-500/10 dark:bg-white dark:text-surface-950',
    line: 'bg-surface-700 dark:bg-surface-300',
    border: 'hover:border-surface-300 dark:hover:border-surface-600',
    text: 'group-hover:text-surface-950 dark:group-hover:text-white',
  },
};

const fallbackAccents = ['violet', 'cyan', 'emerald', 'amber', 'rose', 'slate'] as const;
const fallbackIcons = ['sparkles', 'image', 'wand', 'layers', 'search', 'tag'] as const;

export default function HomeLinkBlocks({ blocks }: { blocks?: HomeLinkBlock[] }) {
  const visibleBlocks = (blocks || []).filter((block) => block.title && block.href);

  if (visibleBlocks.length === 0) return null;

  return (
    <section className="py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 px-2 sm:px-0 mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-primary-500 dark:text-primary-400 font-bold mb-1">Start Here</p>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-surface-950 dark:text-white">Quick Explore</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-2 sm:px-0">
        {visibleBlocks.map((block, index) => {
          const accent = accentMap[block.accent || fallbackAccents[index % fallbackAccents.length]];
          const Icon = iconMap[block.icon || fallbackIcons[index % fallbackIcons.length]];
          const style = block.style || 'showcase';

          if (style === 'compact') {
            return (
              <SmartLink
                key={`${block.href}-${block.title}`}
                href={block.href}
                className={`group flex min-h-[96px] items-center gap-3 rounded-lg border border-surface-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 ${accent.border}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${accent.soft}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-extrabold leading-snug text-surface-950 transition-colors dark:text-white ${accent.text}`}>
                    {block.title}
                  </span>
                  {block.description && (
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                      {block.description}
                    </span>
                  )}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-surface-400 transition-transform group-hover:translate-x-1" />
              </SmartLink>
            );
          }

          if (style === 'clean') {
            return (
              <SmartLink
                key={`${block.href}-${block.title}`}
                href={block.href}
                className={`group relative min-h-[132px] overflow-hidden rounded-lg border border-surface-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 ${accent.border}`}
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${accent.line}`} />
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-lg ${accent.solid}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-surface-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold leading-snug text-surface-950 transition-colors dark:text-white ${accent.text}`}>
                      {block.title}
                    </h3>
                    {block.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                        {block.description}
                      </p>
                    )}
                  </div>
                </div>
              </SmartLink>
            );
          }

          return (
            <SmartLink
              key={`${block.href}-${block.title}`}
              href={block.href}
              className={`group relative min-h-[150px] overflow-hidden rounded-lg border border-surface-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-surface-800 dark:bg-surface-900 ${accent.border}`}
            >
              <div className="absolute inset-x-0 top-0 flex h-12 items-start gap-1.5 px-4 pt-3 opacity-80">
                <span className={`h-2 w-10 rounded-full ${accent.line}`} />
                <span className="h-2 w-4 rounded-full bg-surface-200 dark:bg-surface-700" />
                <span className="h-2 w-7 rounded-full bg-surface-100 dark:bg-surface-800" />
              </div>
              <div className="relative flex h-full flex-col justify-between gap-6 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-lg shadow-lg ${accent.solid}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-surface-200 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-surface-500 transition-colors group-hover:text-surface-800 dark:border-surface-700 dark:bg-surface-950/60 dark:text-surface-400 dark:group-hover:text-white">
                    Open
                  </span>
                </div>
                <div>
                  <h3 className={`text-base md:text-lg font-extrabold leading-snug text-surface-950 transition-colors dark:text-white ${accent.text}`}>
                    {block.title}
                  </h3>
                  {block.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                      {block.description}
                    </p>
                  )}
                </div>
              </div>
            </SmartLink>
          );
        })}
      </div>
    </section>
  );
}
