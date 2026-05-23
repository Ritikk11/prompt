import { fetchSections, fetchSettings, fetchPosts } from '@/lib/data';
import dynamic from 'next/dynamic';
import { getGridClasses } from '@/lib/utils';
import FeaturedSlider from '@/components/FeaturedSlider';
import HomeSection from '@/components/HomeSection';

export const runtime = 'edge';
export const revalidate = 3600;

export default async function Home() {
  const sections = await fetchSections();
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  const homepageSections = sections
    .filter(s => s.visible && (s.location || 'homepage') === 'homepage')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-7xl mx-auto px-1 py-0 sm:py-2 space-y-4">
      {/* Featured Slider */}
      <section>
        <FeaturedSlider featuredPosts={posts.filter(p => p.featured && (p.status === 'published' || !p.status) && p.visibility !== 'private')} settings={settings} />
      </section>

      {/* Main Content */}
      {homepageSections.map(section => (
        <HomeSection key={section.id} section={section} posts={posts} settings={settings} />
      ))}
      
      {homepageSections.length === 0 && (
        <div className="text-center py-12 text-surface-400">
          No sections found. Create one in the admin panel.
        </div>
      )}
    </div>
  );
}
