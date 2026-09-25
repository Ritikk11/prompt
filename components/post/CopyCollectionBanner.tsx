'use client';

import CopyButton from '@/components/CopyButton';
import { usePostPage } from './PostPageProvider';
import type { SiteSettings } from '@/lib/types';

interface CopyCollectionBannerProps {
  post: { isPremium?: boolean };
  images: { prompt: string; aiTool: string }[];
  settings?: SiteSettings;
}

export default function CopyCollectionBanner({ post, images, settings }: CopyCollectionBannerProps) {
  const { user } = usePostPage();

  const isLocked = settings?.features?.premiumPrompts && post.isPremium && !user;
  const allPromptsText = isLocked
    ? 'Premium Collection - Please sign in to view full prompts.'
    : (images || [])
        .map((img, i) => `Image ${i + 1} (${img.aiTool || 'AI'}):\n${img.prompt}`)
        .join('\n\n');

  return (
    <div className="mb-16 p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 text-white text-center shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:scale-150 transition-transform duration-1000" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl translate-y-32 -translate-x-32 group-hover:scale-150 transition-transform duration-1000" />

      <div className="relative z-10">
        <h3 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">
          Copy Entire Collection
        </h3>
        <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
          {images.length === 1
            ? 'Copy this prompt instantly to use in your favorite AI generator.'
            : `Grab all ${images.length} creative prompts instantly to use in your favorite AI generator.`}
        </p>
        <div className="flex justify-center">
          <CopyButton
            text={allPromptsText}
            eventName="collection_copied"
            className="px-6 py-3 text-base shadow-xl border-white/30 bg-white/20 text-white backdrop-blur-xl hover:border-white hover:bg-white hover:text-primary-700 hover:shadow-2xl dark:border-white/30 dark:bg-white/20 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-primary-700"
          />
        </div>
      </div>
    </div>
  );
}
