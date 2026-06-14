export const dynamic = 'force-dynamic';
import { fetchSections, fetchSettings, fetchPostSummaries, getPostsForSection } from '@/lib/data';
import FeaturedSlider from '@/components/FeaturedSlider';
import HomeSection from '@/components/HomeSection';
import HomeLinkBlocks from '@/components/HomeLinkBlocks';


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
      {/* Featured Slider */}
      <section>
        <FeaturedSlider featuredPosts={featuredPosts} settings={settings} />
      </section>

      <HomeLinkBlocks blocks={settings.homeLinkBlocks} />

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
