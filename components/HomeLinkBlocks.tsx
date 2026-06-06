import { ArrowRight } from 'lucide-react';
import type { HomeLinkBlock } from '@/lib/types';
import SmartLink from '@/components/SmartLink';

export default function HomeLinkBlocks({ blocks }: { blocks?: HomeLinkBlock[] }) {
  const visibleBlocks = (blocks || []).filter((block) => block.title && block.href);

  if (visibleBlocks.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold">Featured Pages</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleBlocks.map((block) => (
          <SmartLink
            key={`${block.href}-${block.title}`}
            href={block.href}
            className="group rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm md:text-base text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {block.title}
                </h3>
                {block.description && (
                  <p className="text-xs md:text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                    {block.description}
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </div>
          </SmartLink>
        ))}
      </div>
    </section>
  );
}
