'use client';
import { useData } from '@/components/context/DataContext';
import dynamic from 'next/dynamic';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';

const HomeSection = dynamic(() => import('@/components/HomeSection'));

const FeaturedSlider = dynamic(() => import('@/components/FeaturedSlider'), {
  loading: () => <div className="w-full min-h-[500px] md:min-h-[400px] lg:min-h-[520px] bg-surface-200 dark:bg-surface-800 rounded-2xl animate-pulse shadow-2xl" />
});

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
          {[1, 2, 3].map(n => (
            <div key={n} className="py-6">
              <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded w-48 animate-pulse mb-5" />
              <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mb-1 inline-block w-full break-inside-avoid">
                    <SkeletonPostCard />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {homepageSections.map(section => (
            <HomeSection key={section.id} section={section} />
          ))}
          {!loading && homepageSections.length === 0 && (
            <div className="text-center py-12 text-surface-400">
              No sections found. Create one in the admin panel.
            </div>
          )}
        </>
      )}
    </div>
  );
}
