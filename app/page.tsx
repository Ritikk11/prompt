export const dynamic = 'force-dynamic';
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

  return (
    <div className="max-w-7xl mx-auto px-1 py-0 sm:py-2 space-y-4">
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

      {(settings.features?.showHomepageHowTo ?? true) && <HomeHowItWorks />}

      {(settings.features?.showHomepageReviewProcess ?? true) && <HomeReviewProcess />}

      {(settings.features?.showHomepagePromptOfDay ?? true) && <HomePromptOfDay post={featuredPosts[0] || allPosts[0]} />}

      {(settings.features?.showHomepageSupportedTools ?? true) && <HomeSupportedTools posts={allPosts} settings={settings} />}

      {(settings.features?.showHomepageCreativeDirections ?? true) && <HomeCreativeDirections posts={allPosts} settings={settings} />}

      {(settings.features?.showHomepageCreatorFeedback ?? true) && <HomeCreatorFeedback />}

      {(settings.features?.showHomepageNewsletter ?? true) && <HomeNewsletter />}

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
