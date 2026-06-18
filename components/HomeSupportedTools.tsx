import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Zap } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools, getDefaultImageModel, getToolInfo } from '@/lib/constants';

const defaultToolNotes: Record<string, string[]> = {
  ChatGPT: ['Strong text rendering', 'Reference image workflows', 'Detailed prompt structure'],
  Gemini: ['Fast image ideation', 'Reference-aware prompts', 'Creative variations'],
  Grok: ['Photoreal direction', 'Cinematic scenes', 'Social-first ideas'],
  Qwen: ['Typography prompts', 'Poster layouts', 'Graphic design details'],
};

export default function HomeSupportedTools({ posts, settings }: { posts: Post[]; settings: SiteSettings }) {
  const content = settings.homepageContent?.supportedTools || {};
  const toolNotes = Object.fromEntries(
    (content.items || []).map(item => [
      item.title,
      item.checks?.length ? item.checks : item.text.split(',').map(note => note.trim()).filter(Boolean),
    ])
  ) as Record<string, string[]>;
  const toolCounts = new Map<string, number>();
  posts.forEach(post => getAllTools(post).forEach(tool => toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1)));
  const tools = (settings.aiTools || Array.from(toolCounts.keys())).filter(Boolean).slice(0, 4);
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
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-surface-50 px-5 py-16 dark:bg-surface-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
          <Zap className="h-4 w-4" />
          {content.badge || 'Supported AI tools'}
        </div>
        <h2 className="text-3xl font-extrabold tracking-normal text-surface-950 dark:text-white">{content.title || 'Prompts for Every Major AI Tool'}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
          {content.description || 'Browse prompt collections prepared for the tools your visitors already use.'}
        </p>
      </div>

      <div className="mx-auto mt-9 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool, index) => {
          const info = getToolInfo(tool, settings.toolDetails);
          const model = getDefaultImageModel(tool) || 'Image prompts';
          const notes = getNotesForTool(tool);
          return (
            <Link key={tool} href={`/tool/${encodeURIComponent(tool)}`} className="group rounded-2xl border border-surface-200 bg-surface-50 p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-surface-800 dark:bg-surface-900/70">
              <div className={`h-1 rounded-full ${['bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-fuchsia-500'][index % 4]}`} />
              <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-surface-800">
                {info.logo ? (
                  <span className="relative h-7 w-7 overflow-hidden rounded-full">
                    <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                  </span>
                ) : (
                  <Zap className="h-5 w-5 text-primary-500" />
                )}
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-surface-950 dark:text-white">{tool}</h3>
              <p className="mt-1 text-sm font-bold text-primary-600 dark:text-primary-300">{model}</p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{toolCounts.get(tool) || 0} prompts available</p>
              <div className="mt-5 space-y-2">
                {notes.map(note => (
                  <div key={note} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    {note}
                  </div>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-primary-600 opacity-0 transition group-hover:opacity-100 dark:text-primary-300">
                Explore {tool}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </section>
  );
}
