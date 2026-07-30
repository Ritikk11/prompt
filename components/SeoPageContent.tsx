import React from 'react';
import { Post, SiteSettings } from '@/lib/types';
import { matchesTag, matchesCategory, matchesTool } from '@/lib/sections';
import { isPublicPost } from '@/lib/data';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ScrollReveal from '@/components/ScrollReveal';
import FilterChipRail from '@/components/FilterChipRail';
import PostCard from '@/components/PostCard';

interface SeoPageContentProps {
  seoPage: any;
  allPosts: Post[];
  settings: SiteSettings;
}

export default function SeoPageContent({ seoPage, allPosts, settings }: SeoPageContentProps) {
  const { tags = [], categories = [], aiTools = [] } = seoPage;

  // Filter ONLY show posts that match ALL of the selected tags AND ALL of the selected categories AND ALL of the selected aiTools
  const filteredPosts = allPosts.filter(candidate => {
    if (!isPublicPost(candidate)) return false;
    
    if (tags.length > 0 && !tags.every((tag: string) => matchesTag(candidate, tag))) return false;
    if (categories.length > 0 && !categories.every((category: string) => matchesCategory(candidate, category))) return false;
    if (aiTools.length > 0 && !aiTools.every((tool: string) => matchesTool(candidate, tool))) return false;
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">{seoPage.title}</h1>
        {seoPage.seoDescription && (
          <p className="text-surface-500 dark:text-surface-400 text-base md:text-lg">{seoPage.seoDescription}</p>
        )}
      </div>
      {seoPage.introContent && (
        <div className="max-w-3xl mx-auto mb-10">
          <MarkdownRenderer>{seoPage.introContent}</MarkdownRenderer>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-500">No posts found matching the criteria.</p>
        </div>
      ) : seoPage.filterTags?.length ? (
        <ScrollReveal>
          <FilterChipRail posts={filteredPosts} tags={seoPage.filterTags} tools={[]} showTools={false} settings={settings} cardStyleOverride={seoPage.cardStyle} renderGrid sticky />
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <div data-reveal-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start pt-8">
            {filteredPosts.map((candidate, index) => (
              <PostCard key={candidate.id} post={candidate} index={index} cardStyleOverride={seoPage.cardStyle} />
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
