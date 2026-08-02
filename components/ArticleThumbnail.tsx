import { BookOpen, Camera, Image as ImageIcon, Layers, Palette, Settings, Shield, Sparkles, TrendingUp, Users, Wand2, Lightbulb } from 'lucide-react';
import type { Article, ArticleIcon } from '@/lib/content/types';
import { getArticleImageUrl } from '@/lib/image-url';

export const articleIconMap: Record<ArticleIcon, typeof BookOpen> = {
  wand: Wand2,
  image: ImageIcon,
  book: BookOpen,
  camera: Camera,
  palette: Palette,
  shield: Shield,
  lightbulb: Lightbulb,
  layers: Layers,
  trending: TrendingUp,
  users: Users,
  sparkles: Sparkles,
  settings: Settings,
};

/** Ordered list of all ArticleIcon keys — used for cycling fallback icons. */
export const articleIconList: ArticleIcon[] = ['wand', 'image', 'book', 'camera', 'palette', 'shield', 'lightbulb', 'layers', 'trending', 'users', 'sparkles', 'settings'];

const thumbnailThemes = [
  'from-violet-600 via-fuchsia-500 to-rose-400',
  'from-sky-500 via-cyan-400 to-emerald-400',
  'from-amber-400 via-orange-500 to-pink-500',
  'from-indigo-600 via-blue-500 to-cyan-400',
  'from-emerald-500 via-teal-400 to-sky-500',
  'from-purple-700 via-violet-500 to-indigo-400',
  'from-rose-500 via-pink-500 to-violet-500',
  'from-slate-800 via-slate-700 to-violet-600',
];

function hashString(value: string) {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export default function ArticleThumbnail({
  article,
  compact = false,
  thumbnailUrl,
}: {
  article: Article;
  compact?: boolean;
  thumbnailUrl?: string;
}) {
  const theme = thumbnailThemes[hashString(article.slug) % thumbnailThemes.length];
  const imageUrl = getArticleImageUrl(thumbnailUrl || article.thumbnailUrl);
  const canRenderImage = Boolean(imageUrl && imageUrl !== 'Uploading...');

  const thumbnailBackground = canRenderImage
    ? 'bg-white dark:bg-surface-900'
    : `bg-gradient-to-br ${theme}`;

  return (
    <div
      className={`relative isolate aspect-[16/9] overflow-hidden rounded-[14px] ${thumbnailBackground} text-white`}
      style={{ clipPath: 'inset(0 round 14px)' }}
    >
      {canRenderImage && (
        <div className="relative h-full w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            loading={compact ? 'lazy' : 'eager'}
            decoding="async"
            fetchPriority={compact ? 'auto' : 'high'}
          />
        </div>
      )}
      {!canRenderImage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.38),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.20),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.24))]" />
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full border border-white/25" />
          <div className="absolute -bottom-16 right-4 h-40 w-40 rounded-full border border-white/20" />
        </>
      )}
      <div className="relative z-10 h-full" />
    </div>
  );
}
