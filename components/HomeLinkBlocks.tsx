import { ArrowRight, ImageIcon, Layers, Search, Sparkles, Tag, Wand2 } from 'lucide-react';
import type { HomeLinkBlock } from '@/lib/types';
import SmartLink from '@/components/SmartLink';

const icons = {
  sparkles: Sparkles,
  image: ImageIcon,
  wand: Wand2,
  layers: Layers,
  search: Search,
  tag: Tag,
};

const accents = {
  violet: {
    card: 'border-violet-200/70 dark:border-violet-500/20 hover:border-violet-400 dark:hover:border-violet-400/60',
    icon: 'bg-violet-500 text-white shadow-violet-500/25',
    glow: 'from-violet-500/18 via-fuchsia-500/8 to-transparent',
    text: 'group-hover:text-violet-600 dark:group-hover:text-violet-300',
  },
  cyan: {
    card: 'border-cyan-200/70 dark:border-cyan-500/20 hover:border-cyan-400 dark:hover:border-cyan-400/60',
    icon: 'bg-cyan-500 text-white shadow-cyan-500/25',
    glow: 'from-cyan-500/18 via-sky-500/8 to-transparent',
    text: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-300',
  },
  emerald: {
    card: 'border-emerald-200/70 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-400/60',
    icon: 'bg-emerald-500 text-white shadow-emerald-500/25',
    glow: 'from-emerald-500/18 via-teal-500/8 to-transparent',
    text: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
  },
  amber: {
    card: 'border-amber-200/70 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-400/60',
    icon: 'bg-amber-500 text-white shadow-amber-500/25',
    glow: 'from-amber-500/18 via-orange-500/8 to-transparent',
    text: 'group-hover:text-amber-600 dark:group-hover:text-amber-300',
  },
  rose: {
    card: 'border-rose-200/70 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-400/60',
    icon: 'bg-rose-500 text-white shadow-rose-500/25',
    glow: 'from-rose-500/18 via-pink-500/8 to-transparent',
    text: 'group-hover:text-rose-600 dark:group-hover:text-rose-300',
  },
  slate: {
    card: 'border-surface-200 dark:border-surface-700 hover:border-surface-400 dark:hover:border-surface-500',
    icon: 'bg-surface-800 dark:bg-surface-100 text-white dark:text-surface-950 shadow-surface-500/15',
    glow: 'from-surface-400/12 via-surface-500/6 to-transparent',
    text: 'group-hover:text-surface-950 dark:group-hover:text-white',
  },
};

export default function HomeLinkBlocks({ blocks }: { blocks?: HomeLinkBlock[] }) {
  const visibleBlocks = (blocks || []).filter((block) => block.title && block.href);

  if (visibleBlocks.length === 0) return null;

  return (
    <section className="py-3 sm:py-5">
      <div className="flex items-end justify-between gap-4 px-2 sm:px-0 mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-primary-500 dark:text-primary-400 font-bold mb-1">Start Here</p>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-surface-950 dark:text-white">Quick Explore</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-2 sm:px-0">
        {visibleBlocks.map((block, index) => {
          const accentKey = block.accent || (['violet', 'cyan', 'emerald', 'amber', 'rose', 'slate'] as const)[index % 6];
          const iconKey = block.icon || (['sparkles', 'image', 'wand', 'layers', 'search', 'tag'] as const)[index % 6];
          const style = accents[accentKey];
          const Icon = icons[iconKey];

          return (
          <SmartLink
            key={`${block.href}-${block.title}`}
            href={block.href}
            className={`group relative overflow-hidden rounded-2xl border ${style.card} bg-white dark:bg-surface-900 p-4 min-h-[138px] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${style.glow} opacity-80`} />
            <div className="relative flex h-full flex-col justify-between gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className={`w-10 h-10 rounded-xl ${style.icon} shadow-lg flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-current group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
              <div className="min-w-0">
                <h3 className={`font-extrabold text-base md:text-lg leading-snug text-surface-950 dark:text-white ${style.text} transition-colors`}>
                  {block.title}
                </h3>
                {block.description && (
                  <p className="text-xs md:text-sm text-surface-600 dark:text-surface-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {block.description}
                  </p>
                )}
              </div>
            </div>
          </SmartLink>
        )})}
      </div>
    </section>
  );
}
