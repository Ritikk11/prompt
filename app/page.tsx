export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import type { ReactNode } from 'react';
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
import HomeNewsletter from '@/components/HomeNewsletter';
import HomeCreatorFeedback from '@/components/HomeCreatorFeedback';

const defaultHomepageBlockOrder = [
  'howTo',
  'reviewProcess',
  'promptOfDay',
  'supportedTools',
  'creativeDirections',
  'creatorFeedback',
  'newsletter',
];

export default async function Home() {
  const sections = await fetchSections();
  const settings = await fetchSettings();
  const allPosts = await fetchPostSummaries();
  const featuredPosts = allPosts.filter(p => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private');
  
  const homepageSections = sections
    .filter(s => s.visible && (s.location || 'homepage') === 'homepage')
    .sort((a, b) => a.order - b.order);

  // Pre-fetch posts for each section on the server
  const sectionPostsData = await Promise.all(
    homepageSections.map(section => getPostsForSection(section, settings, allPosts))
  );
  const homepageBlockOrder = [
    ...(settings.homepageBlockOrder || []),
    ...defaultHomepageBlockOrder.filter(key => !(settings.homepageBlockOrder || []).includes(key)),
  ];
  const homepageBlocks: Record<string, ReactNode> = {
    howTo: (settings.features?.showHomepageHowTo ?? true) ? <HomeHowItWorks /> : null,
    reviewProcess: (settings.features?.showHomepageReviewProcess ?? true) ? <HomeReviewProcess /> : null,
    promptOfDay: (settings.features?.showHomepagePromptOfDay ?? true) ? <HomePromptOfDay post={featuredPosts[0] || allPosts[0]} /> : null,
    supportedTools: (settings.features?.showHomepageSupportedTools ?? true) ? <HomeSupportedTools posts={allPosts} settings={settings} /> : null,
    creativeDirections: (settings.features?.showHomepageCreativeDirections ?? true) ? <HomeCreativeDirections posts={allPosts} settings={settings} /> : null,
    creatorFeedback: (settings.features?.showHomepageCreatorFeedback ?? true) ? <HomeCreatorFeedback /> : null,
    newsletter: (settings.features?.showHomepageNewsletter ?? true) ? <HomeNewsletter /> : null,
  };

  return (
    <div className="max-w-7xl mx-auto px-1 py-0">
      {(settings.features?.showHomepageLibraryHero ?? true) && settings.heroStyle !== 'v9' && (
        <HomeLibraryHero featuredPosts={featuredPosts} settings={settings} postCount={allPosts.length} />
      )}

      {/* Featured Slider */}
      <section>
        <FeaturedSlider
          featuredPosts={featuredPosts}
          settings={settings}
          stats={{ postCount: allPosts.length, sectionCount: homepageSections.length }}
        />
      </section>

      <HomeLinkBlocks blocks={settings.homeLinkBlocks} />

      {homepageBlockOrder.map(key => homepageBlocks[key] ? (
        <div key={key}>{homepageBlocks[key]}</div>
      ) : null)}

      {/* Main Content */}
      {homepageSections.map((section, idx) => (
        <HomeSection key={section.id} section={section} initialPosts={sectionPostsData[idx]} settings={settings} />
      ))}
      
      {homepageSections.length === 0 && (
        <div className="text-center py-12 text-surface-400">
          No sections found. Create one in the admin panel.
        </div>
      )}
    </div>
  );
}
