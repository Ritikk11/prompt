'use client';
import { useData } from '@/components/context/DataContext';
import FeaturedSlider from '@/components/FeaturedSlider';
import HomeSection from '@/components/HomeSection';

export default function Home() {
  const { sections } = useData();
  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Featured Slider */}
      <section>
        <FeaturedSlider />
      </section>

      {/* Sections */}
      {visibleSections.map(section => (
        <HomeSection key={section.id} section={section} />
      ))}
    </div>
  );
}
