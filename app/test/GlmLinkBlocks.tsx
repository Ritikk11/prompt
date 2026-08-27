import { ArrowRight, ImageIcon, Layers, Search, Sparkles, Tag, Wand2 } from 'lucide-react';
import type { HomeLinkBlock, SiteSettings } from '@/lib/types';
import SmartLink from '@/components/SmartLink';
import { glassCard } from './GlmSection';
import GlmReveal from './GlmReveal';

const iconMap = {
  sparkles: Sparkles,
  image: ImageIcon,
  wand: Wand2,
  layers: Layers,
  search: Search,
  tag: Tag,
};

// Glass-friendly accents built on the Google brand quad. Legacy admin accent
// names (violet/cyan/emerald/amber/rose) map onto the nearest brand color.
const accentMap = {
  blue: {
    soft: 'bg-primary-500/10 text-primary-700 dark:bg-primary-400/15 dark:text-primary-200',
    solid: 'bg-gradient-to-br from-google-blue to-primary-700 text-white shadow-primary-500/25',
    line: 'bg-google-blue',
    text: 'group-hover:text-primary-700 dark:group-hover:text-primary-200',
  },
  green: {
    soft: 'bg-google-green/10 text-[#188038] dark:bg-google-green/15 dark:text-[#81c995]',
    solid: 'bg-gradient-to-br from-google-green to-[#188038] text-white shadow-google-green/25',
    line: 'bg-google-green',
    text: 'group-hover:text-[#188038] dark:group-hover:text-[#81c995]',
  },
  yellow: {
    soft: 'bg-google-yellow/15 text-[#b26a00] dark:bg-google-yellow/15 dark:text-[#fdd663]',
    solid: 'bg-gradient-to-br from-google-yellow to-[#ea8600] text-white shadow-google-yellow/25',
    line: 'bg-google-yellow',
    text: 'group-hover:text-[#b26a00] dark:group-hover:text-[#fdd663]',
  },
  red: {
    soft: 'bg-google-red/10 text-[#c5221f] dark:bg-google-red/15 dark:text-[#f28b82]',
    solid: 'bg-gradient-to-br from-google-red to-[#c5221f] text-white shadow-google-red/25',
    line: 'bg-google-red',
    text: 'group-hover:text-[#c5221f] dark:group-hover:text-[#f28b82]',
  },
  slate: {
    soft: 'bg-surface-500/10 text-surface-700 dark:bg-white/10 dark:text-surface-200',
    solid: 'bg-gradient-to-br from-surface-700 to-surface-900 text-white shadow-surface-500/25 dark:from-surface-200 dark:to-white dark:text-surface-950',
    line: 'bg-surface-500',
    text: 'group-hover:text-surface-950 dark:group-hover:text-white',
  },
};

const accentAliases: Record<string, keyof typeof accentMap> = {
  violet: 'blue',
  cyan: 'blue',
  emerald: 'green',
  amber: 'yellow',
  rose: 'red',
  slate: 'slate',
  blue: 'blue',
  green: 'green',
  yellow: 'yellow',
  red: 'red',
};

const fallbackAccents = ['blue', 'green', 'yellow', 'red', 'slate'] as const;
const fallbackIcons = ['sparkles', 'image', 'wand', 'layers', 'search', 'tag'] as const;

export default function GlmLinkBlocks({ settings }: { settings?: SiteSettings }) {
  const visibleBlocks = (settings?.homeLinkBlocks || []).filter(block => block.title && block.href);

  if (visibleBlocks.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-1 py-8">
      <div>
        <GlmReveal slide className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-300">Start Here</p>
            <h2 className="text-lg font-extrabold tracking-tight text-surface-950 dark:text-white md:text-xl">Quick Explore</h2>
          </div>
        </GlmReveal>
        <GlmReveal stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBlocks.map((block, index) => {
            const accentKey = accentAliases[block.accent || ''] || fallbackAccents[index % fallbackAccents.length];
            const accent = accentMap[accentKey];
            const Icon = iconMap[block.icon || fallbackIcons[index % fallbackIcons.length]];
            const style = block.style || 'showcase';

            if (style === 'compact') {
              return (
                <SmartLink
                  key={`${block.href}-${block.title}`}
                  href={block.href}
                  className={`group flex min-h-[96px] items-center gap-3 ${glassCard} p-4 transition-all duration-200 hover:scale-[1.01] hover:border-primary-400/60 hover:shadow-xl`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.soft}`}>
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
                  className={`group relative min-h-[132px] overflow-hidden ${glassCard} p-4 transition-all duration-200 hover:scale-[1.01] hover:border-primary-400/60 hover:shadow-xl`}
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
                className={`group relative min-h-[150px] overflow-hidden ${glassCard} p-4 transition-all duration-200 hover:scale-[1.01] hover:border-primary-400/60 hover:shadow-xl`}
              >
                <div className="absolute inset-x-0 top-0 flex h-12 items-start gap-1.5 px-4 pt-3 opacity-80">
                  <span className={`h-2 w-10 rounded-full ${accent.line}`} />
                  <span className="h-2 w-4 rounded-full bg-surface-300/60 dark:bg-white/15" />
                  <span className="h-2 w-7 rounded-full bg-surface-200/60 dark:bg-white/10" />
                </div>
                <div className="relative flex h-full flex-col justify-between gap-6 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-lg shadow-lg ${accent.solid}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-surface-500 transition-colors group-hover:text-surface-800 dark:border-white/10 dark:bg-white/5 dark:text-surface-400 dark:group-hover:text-white">
                      Open
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold leading-snug text-surface-950 transition-colors dark:text-white md:text-lg ${accent.text}`}>
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
        </GlmReveal>
      </div>
    </section>
  );
}
