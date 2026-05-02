


import { Sparkles, Image as ImageIcon, Users } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-4xl md:text-6xl font-black mb-8 text-surface-900 dark:text-white text-center">About Us</h1>
      
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <p className="text-lg md:text-xl text-surface-600 dark:text-surface-300">
          We are dedicated to building the largest and most curated collection of AI engineering prompts to inspire creators, designers, and developers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-surface-50 dark:bg-surface-800 p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-surface-900 dark:text-white">Curated Quality</h3>
          <p className="text-surface-600 dark:text-surface-300 text-sm">Every prompt is tested and verified to ensure high-quality, predictable outputs.</p>
        </div>

        <div className="bg-surface-50 dark:bg-surface-800 p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-surface-900 dark:text-white">Multiple AI Tools</h3>
          <p className="text-surface-600 dark:text-surface-300 text-sm">From Midjourney to tools like Stable Diffusion and DALL-E, we cover all major platforms.</p>
        </div>

        <div className="bg-surface-50 dark:bg-surface-800 p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-surface-900 dark:text-white">Community Driven</h3>
          <p className="text-surface-600 dark:text-surface-300 text-sm">Join our platform to share your own prompts, copy prompt techniques, and build your portfolio.</p>
        </div>
      </div>
    </div>
  );
}
