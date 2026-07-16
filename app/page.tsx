export const revalidate = 300;
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import dynamic from 'next/dynamic';
import { fetchSections, fetchSettings, fetchPostSummaries, getPostsForSection } from '@/lib/data';
import { getAllTools } from '@/lib/constants';
import { getPromptImageUrl } from '@/lib/image-url';
import FeaturedSlider from '@/components/FeaturedSlider';
import HomeLinkBlocks from '@/components/HomeLinkBlocks';
import HomeLibraryHero from '@/components/HomeLibraryHero';
import HomeReviewProcess from '@/components/HomeReviewProcess';
import HomePromptOfDay from '@/components/HomePromptOfDay';
import HomeCreativeDirections from '@/components/HomeCreativeDirections';
import HomeSupportedTools from '@/components/HomeSupportedTools';
import HomeGuides from '@/components/HomeGuides';
import HomeCreatorFeedback from '@/components/HomeCreatorFeedback';
import ScrollReveal from '@/components/ScrollReveal';

// Below-fold client components: code-split their JS out of the critical path
// so the LCP element paints without main-thread blocking. SSR stays enabled
// (default) so content/SEO is unaffected — only the hydration JS is deferred.
const HomeSection = dynamic(() => import('@/components/HomeSection'));
const HomeHowItWorks = dynamic(() => import('@/components/HomeHowItWorks'));

const defaultHomepageBlockOrder = [
  'howTo',
  'reviewProcess',
  'promptOfDay',
  'supportedTools',
  'creativeDirections',
  'guides',
  'creatorFeedback',
];

function normalizeBlockToken(key: string) {
  return key.startsWith('block:') || key.startsWith('section:') ? key : `block:${key}`;
}

export default async function Home() {
  const sections = await fetchSections();
  const settings = await fetchSettings();
  const allPosts = await fetchPostSummaries();
  const featuredPosts = allPosts.filter(p => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private');
  // Preload the first hero slide (the LCP image) so the browser fetches it
  // before the client slider hydrates. Must match FeaturedSlider's URL params.
  const firstSlide = featuredPosts[0];
  if (settings.heroEnabled && firstSlide) {
    const lcpImageUrl = getPromptImageUrl(firstSlide.thumbnailUrl || firstSlide.images[0]?.url || '', { width: 960, quality: 78 });
    if (lcpImageUrl) preload(lcpImageUrl, { as: 'image', fetchPriority: 'high' });
  }
  // Empty tool pages return 404, so hero/slider tool chips only link tools with posts.
  const toolsWithPosts = new Set(allPosts.flatMap(post => getAllTools(post)));
  const linkableToolSettings = {
    ...settings,
    aiTools: (settings.aiTools || []).filter(tool => toolsWithPosts.has(tool)),
  };

  const homepageSections = sections
    .filter(s => s.visible && (s.location || 'homepage') === 'homepage')
    .sort((a, b) => a.order - b.order);
  const pinnedPromptOfDayId = settings.homepageContent?.promptOfDay?.pinnedPostId;
  const promptOfDayPost = allPosts.find(post => post.id === pinnedPromptOfDayId || post.slug === pinnedPromptOfDayId) || featuredPosts[0] || allPosts[0];

  // Pre-fetch posts for each section on the server
  const sectionPostsData = await Promise.all(
    homepageSections.map(section => getPostsForSection(section, settings, allPosts))
  );
  const homepageSectionIds = new Set(homepageSections.map(section => section.id));
  const defaultHomepageOrder = [
    ...defaultHomepageBlockOrder.map(key => `block:${key}`),
    ...homepageSections.map(section => `section:${section.id}`),
  ];
  const savedHomepageOrder = (settings.homepageBlockOrder || []).map(normalizeBlockToken);
  const homepageOrder = [
    ...savedHomepageOrder.filter(token => {
      if (token.startsWith('block:')) return defaultHomepageBlockOrder.includes(token.replace('block:', ''));
      if (token.startsWith('section:')) return homepageSectionIds.has(token.replace('section:', ''));
      return false;
    }),
    ...defaultHomepageOrder.filter(token => !savedHomepageOrder.includes(token)),
  ];
  const homepageBlocks: Record<string, ReactNode> = {
    howTo: (settings.features?.showHomepageHowTo ?? true) ? <HomeHowItWorks settings={settings} /> : null,
    reviewProcess: (settings.features?.showHomepageReviewProcess ?? true) ? <HomeReviewProcess settings={settings} /> : null,
    promptOfDay: (settings.features?.showHomepagePromptOfDay ?? true) ? <HomePromptOfDay post={promptOfDayPost} settings={settings} /> : null,
    supportedTools: (settings.features?.showHomepageSupportedTools ?? true) ? <HomeSupportedTools posts={allPosts} settings={settings} /> : null,
    creativeDirections: (settings.features?.showHomepageCreativeDirections ?? true) ? <HomeCreativeDirections posts={allPosts} settings={settings} /> : null,
    creatorFeedback: (settings.features?.showHomepageCreatorFeedback ?? true) ? <HomeCreatorFeedback settings={settings} /> : null,
    guides: (settings.features?.showHomepageGuides ?? true) ? <HomeGuides settings={settings} /> : null,
  };
  const homepageSectionPosts = new Map(homepageSections.map((section, index) => [section.id, sectionPostsData[index]]));
  const homepageSectionsById = new Map(homepageSections.map(section => [section.id, section]));

  return (
    <div className="w-full overflow-x-hidden">
      {(settings.features?.showHomepageLibraryHero ?? true) && settings.heroStyle !== 'v9' && (
        <HomeLibraryHero featuredPosts={featuredPosts} settings={linkableToolSettings} postCount={allPosts.length} />
      )}

      {/* Featured Slider */}
      <ScrollReveal delay={100}>
        <section className="mx-auto max-w-7xl px-1 py-0">
          <FeaturedSlider
            featuredPosts={featuredPosts}
            settings={linkableToolSettings}
            stats={{ postCount: allPosts.length, sectionCount: homepageSections.length }}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className="mx-auto max-w-7xl px-1 py-0">
          <HomeLinkBlocks blocks={settings.homeLinkBlocks} />
        </div>
      </ScrollReveal>

      {homepageOrder.map(token => {
        if (token.startsWith('block:')) {
          const key = token.replace('block:', '');
          if (!homepageBlocks[key]) return null;
          return <ScrollReveal key={token}>{homepageBlocks[key]}</ScrollReveal>;
        }
        const sectionId = token.replace('section:', '');
        const section = homepageSectionsById.get(sectionId);
        if (!section) return null;
        return (
          <ScrollReveal key={token} className="mx-auto max-w-7xl px-1 py-0">
            <HomeSection section={section} initialPosts={homepageSectionPosts.get(sectionId) || []} settings={settings} />
          </ScrollReveal>
        );
      })}

      {homepageSections.length === 0 && (
        <div className="text-center py-12 text-surface-400">
          No sections found. Create one in the admin panel.
        </div>
      )}
    </div>
  );
}
