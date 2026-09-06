import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookmarkCheck, Check, Cpu, Gauge, Layers, Zap } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools, getDefaultImageModel, getToolInfo } from '@/lib/constants';
import ScrollReveal from '@/components/ScrollReveal';
import SectionHeader from '@/components/SectionHeader';

const defaultToolNotes: Record<string, string[]> = {
  ChatGPT: ['Strong text rendering', 'Reference image workflows', 'Detailed prompt structure'],
  Gemini: ['Fast image ideation', 'Reference-aware prompts', 'Creative variations'],
  Grok: ['Photoreal direction', 'Cinematic scenes', 'Social-first ideas'],
  Qwen: ['Typography prompts', 'Poster layouts', 'Graphic design details'],
};

// Brand-quad accent bars cycle across the tool cards.
const accentBars = ['bg-google-blue', 'bg-google-green', 'bg-google-yellow', 'bg-google-red'];

/** Tinted inset panel — glass inside glass would double the frost. */
const insetPanel = 'border border-white/60 bg-white/40 dark:border-white/10 dark:bg-white/5';


export default function HomeSupportedTools({ posts, settings }: { posts: Post[]; settings: SiteSettings }) {
  const content = settings.homepageContent?.supportedTools || {};
  const toolNotes = Object.fromEntries(
    (content.items || []).map(item => [
      item.title,
      item.checks?.length ? item.checks : item.text.split(',').map(note => note.trim()).filter(Boolean),
    ])
  ) as Record<string, string[]>;
  const toolCounts = new Map<string, number>();
  // Count by lowercased name so settings.aiTools casing doesn't hide tools.
  posts.forEach(post => getAllTools(post).forEach(tool => {
    const key = tool.toLowerCase();
    toolCounts.set(key, (toolCounts.get(key) || 0) + 1);
  }));
  const tools = (settings.aiTools || Array.from(toolCounts.keys()))
    .filter(Boolean)
    // Tools configured in settings always render a page (empty state when no
    // posts yet), so no has-posts filter here.
    .slice(0, 4);
  const getNotesForTool = (tool: string) => {
    const normalizedTool = tool.toLowerCase();
    const matchedCustomNotes = Object.entries(toolNotes).find(([name]) => {
      const normalizedName = name.toLowerCase();
      return normalizedName === normalizedTool || normalizedTool.includes(normalizedName) || normalizedName.includes(normalizedTool);
    })?.[1];

    return matchedCustomNotes || defaultToolNotes[tool] || ['Organized prompt format', 'Model notes', 'Reusable examples'];
  };

  if (tools.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal slide>
          <SectionHeader
            icon={<Zap className="h-4 w-4" />}
            badge={content.badge || 'Pro-grade compatibility'}
            title={content.title || 'Prompts for Every Major Image Tool'}
            accentWord="Every Major"
            description={content.description || 'Find prompt sets organized by the image tools people actually create with, so you can choose the right workflow before you start experimenting.'}
          />
        </ScrollReveal>

        <ScrollReveal stagger className="mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, index) => {
            const info = getToolInfo(tool, settings.toolDetails);
            const model = getDefaultImageModel(tool) || 'Image prompts';
            const details = settings.toolDetails?.[tool];
            const notes = details?.checks?.length ? details.checks : getNotesForTool(tool);
            const stats = details?.stats?.length ? details.stats : [
              { label: 'Prompt Power', value: 'Optimized' },
              { label: 'Flexibility', value: 'Stellar' },
              { label: 'Compatibility', value: 'Verified' },
            ];
            const statIcons = [Cpu, Gauge, Layers];
            return (
              <Link key={tool} href={`/tool/${encodeURIComponent(tool)}`} className="group glass-card flex h-full flex-col p-6 transition hover:scale-[1.02] hover:border-primary-400/60 hover:shadow-2xl dark:hover:border-primary-400/50">
                <div className={`h-1 rounded-full ${accentBars[index % 4]}`} />
                <div className="mt-5 flex items-center justify-between gap-2">
                  {!content.hidePromptCounts ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-surface-600 dark:text-surface-300 ${insetPanel}`}>
                      <BookmarkCheck className="h-3.5 w-3.5 text-primary-500" /> {toolCounts.get(tool.toLowerCase()) || 0} prompts
                    </span>
                  ) : <div />}
                  <span className="truncate text-right text-[9px] font-black uppercase tracking-wider text-surface-500 dark:text-surface-400">{details?.badge || 'AI prompts library'}</span>
                </div>
                <div className={`mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl ${insetPanel}`}>
                  {info.logo ? (
                    <span className="relative h-7 w-7 overflow-hidden rounded-full">
                      <Image src={info.logo} alt={`${tool} logo`} width={56} height={56} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </span>
                  ) : (
                    <Zap className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <h3 className="mt-5 text-center text-lg font-extrabold text-surface-950 dark:text-white">{tool}</h3>
                <p className="mt-1 text-center text-sm font-bold text-primary-600 dark:text-primary-300">{model}</p>
                <div className={`mt-5 grid grid-cols-3 gap-1 rounded-2xl p-3 ${insetPanel}`}>
                  {stats.slice(0, 3).map((stat, statIndex) => {
                    const Icon = statIcons[statIndex] || Layers;
                    return (
                      <div key={`${stat.label}-${statIndex}`} className="min-w-0 text-center">
                        <Icon className="mx-auto h-3.5 w-3.5 text-surface-400" />
                        <p className="mt-1 truncate text-[10px] font-black text-surface-800 dark:text-white">{stat.value}</p>
                        <p className="truncate text-[8px] text-surface-500 dark:text-surface-400">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex-1 space-y-3">
                  {notes.map(note => (
                    <div key={note} className="flex items-start gap-2 text-xs font-medium text-surface-600 dark:text-surface-300">
                      <span className="mt-0.5 rounded-full bg-emerald-500/15 p-0.5"><Check className="h-3 w-3 text-emerald-500" /></span>
                      {note}
                    </div>
                  ))}
                </div>
                <div className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/40 px-4 py-3 text-xs font-bold text-surface-800 transition group-hover:border-primary-500 group-hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:group-hover:border-primary-400 dark:group-hover:text-primary-300">
                  Explore Collection
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
