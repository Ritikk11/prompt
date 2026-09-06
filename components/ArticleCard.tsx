import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Article } from '@/lib/content/types';
import ArticleThumbnail from '@/components/ArticleThumbnail';

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatArticleDate(iso: string) {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : dateFormatter.format(parsed);
}

export default function ArticleCard({ article, thumbnailUrl }: { article: Article; thumbnailUrl?: string }) {
  const href = article.category === 'guide' ? `/guides/${article.slug}` : `/blog/${article.slug}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white/60 p-3 shadow-[0_2px_10px_rgba(15,23,42,0.10)] backdrop-blur-[16px] backdrop-saturate-150 transition hover:border-primary-400/60 hover:shadow-[0_18px_38px_-18px_rgba(66,133,244,0.35)] dark:border-white/10 dark:bg-white/[0.08]"
    >
      <ArticleThumbnail article={article} compact thumbnailUrl={thumbnailUrl} />
      <div className="flex flex-1 flex-col p-2 pt-5">
        <h2 className="text-lg font-black leading-snug text-surface-950 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300">
          {article.title}
        </h2>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-surface-600 dark:text-surface-400">{article.description}</p>
        <div className="mt-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
          <span>{formatArticleDate(article.datePublished)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readMinutes} min read</span>
        </div>
      </div>
    </Link>
  );
}
