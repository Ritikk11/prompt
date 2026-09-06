// 12h TTL: admin edits (posts, sections, and settings — which is also where the
// articles live) call revalidatePath, and settings even revalidates the root
// layout, so content never waits on this window. It only bounds staleness of
// view/like counts and the trending order derived from them, because those are
// written by /api/posts on nearly every page view and deliberately skip
// revalidation. Shorter windows only bought cold SSR misses: 300s cost ~2.5s
// every 5 minutes.
export const revalidate = 43200;
import type { ReactNode } from 'react';
import { Fragment } from 'react';
import type { Metadata } from 'next';

// Homepage canonical — points crawlers at the bare root, collapsing any
// ?ref=/utm_/trailing-slash variants Google may discover into one indexed URL.
export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

import { fetchSections, fetchSettings, fetchPostSummaries, getPostsForSection } from '@/lib/data';
import FeaturedSlider from '@/components/FeaturedSlider';
import HomeSection from '@/components/HomeSection';
import HomeLinkBlocks from '@/components/HomeLinkBlocks';
import HomeHowItWorks from '@/components/HomeHowItWorks';
import HomeLibraryHero from '@/components/HomeLibraryHero';
import HomeReviewProcess from '@/components/HomeReviewProcess';
import HomePromptOfDay from '@/components/HomePromptOfDay';
import HomeCreativeDirections from '@/components/HomeCreativeDirections';
import HomeSupportedTools from '@/components/HomeSupportedTools';
import HomeGuides from '@/components/HomeGuides';
import HomeBlog from '@/components/HomeBlog';
import HomeCreatorFeedback from '@/components/HomeCreatorFeedback';

const defaultHomepageBlockOrder = [
  'howTo',
  'reviewProcess',
  'promptOfDay',
  'supportedTools',
  'creativeDirections',
  'guides',
  'blog',
  'creatorFeedback',
];

function normalizeBlockToken(key: string) {
  return key.startsWith('block:') || key.startsWith('section:') ? key : `block:${key}`;
}

export default async function Home() {
  // Parallelize the three independent homepage reads (settings, sections,
  // post summaries) instead of awaiting them sequentially — cuts the
  // data-fetch waterfall that was adding latency to every homepage render.
  const [sections, settings, allPosts] = await Promise.all([
    fetchSections(),
    fetchSettings(),
    fetchPostSummaries(),
  ]);
  const featuredPosts = allPosts.filter(p => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private');
  // No hero-image preload: the LCP element is the landing hero's H1 (text), and
  // the featured slider now sits below it. Preloading a below-fold image at high
  // priority only competes with the critical path. The slider's frosted backdrop
  // loads eagerly on its own; its slide images are lazy.
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
    blog: (settings.features?.showHomepageBlog ?? true) ? <HomeBlog settings={settings} /> : null,
  };
  const homepageSectionPosts = new Map(homepageSections.map((section, index) => [section.id, sectionPostsData[index]]));
  const homepageSectionsById = new Map(homepageSections.map(section => [section.id, section]));

  return (
    /* overflow-x-clip, NOT overflow-x-hidden: `hidden` forces overflow-y to
       compute to `auto`, making this div a scroll container. The scroll-reveal
       translateY(32px) then momentarily overflows it, flashing a vertical
       scrollbar that shifts the whole page sideways on Windows. `clip` never
       creates a scroll container. */
    <div className="w-full overflow-x-clip">
      {(settings.features?.showHomepageLibraryHero ?? true) && (
        <HomeLibraryHero featuredPosts={featuredPosts} settings={settings} postCount={allPosts.length} />
      )}

      {/* Featured Slider — NOT wrapped in ScrollReveal: the reveal hides content
          at opacity 0 until hydration + IntersectionObserver run, which delays the
          LCP image paint by seconds on throttled mobile CPUs. Above-fold content
          must be visible in the server-rendered HTML. The wrapper is gated too so
          a disabled slider leaves no empty padded section behind. */}
      {settings.heroEnabled && featuredPosts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-2 py-8">
          <FeaturedSlider
            featuredPosts={featuredPosts}
            settings={settings}
            stats={{ postCount: allPosts.length, sectionCount: homepageSections.length }}
          />
        </section>
      )}

      {/* Each block below owns its own ScrollReveal entrances — do NOT wrap
          them here. A wrapper reveal would nest inside the block's own,
          compounding the transforms and holding the inner ones at opacity 0
          until the outer one fires. */}
      <div className="mx-auto max-w-7xl px-2 py-0">
        <HomeLinkBlocks blocks={settings.homeLinkBlocks} />
      </div>

      {homepageOrder.map(token => {
        if (token.startsWith('block:')) {
          const key = token.replace('block:', '');
          if (!homepageBlocks[key]) return null;
          return <Fragment key={token}>{homepageBlocks[key]}</Fragment>;
        }
        const sectionId = token.replace('section:', '');
        const section = homepageSectionsById.get(sectionId);
        if (!section) return null;
        return (
          <div key={token} className="mx-auto max-w-7xl px-2 py-0">
            <HomeSection section={section} initialPosts={homepageSectionPosts.get(sectionId) || []} settings={settings} />
          </div>
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
