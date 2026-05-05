'use client';
import { useData } from '@/components/context/DataContext';
import HomeSection from '@/components/HomeSection';
import FeaturedSlider from '@/components/FeaturedSlider';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';


export default function Home() {
  const { sections, loading, settings } = useData();
  const homepageSections = sections
    .filter(s => s.visible && (s.location || 'homepage') === 'homepage')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-7xl mx-auto px-1 py-4 sm:py-6 space-y-4">
      {/* Featured Slider */}
      <section>
        <FeaturedSlider />
      </section>

      {/* Main Content */}
      {loading ? (
        <>
          <div className="py-6">
            <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded w-48 animate-pulse mb-5" />
            <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
               {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="mb-1 inline-block w-full break-inside-avoid">
                   <SkeletonPostCard />
                 </div>
               ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {homepageSections.length > 0 ? (
            homepageSections.map(section => (
              <HomeSection key={section.id} section={section} />
            ))
          ) : (
            <>
              <HomeSection section={{ id: 'fallback-latest', name: 'Latest Prompts', type: 'latest', order: 1, limit: 10, visible: true }} />
              <HomeSection section={{ id: 'fallback-popular', name: 'Popular Prompts', type: 'popular', order: 2, limit: 10, visible: true }} />
            </>
          )}
        </>
      )}
    </div>
  );
}
