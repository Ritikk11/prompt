
import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';

export default async function About() {
  const settings = await fetchSettings();
  
  const defaultContent = `
# About Us

We are dedicated to building the largest and most curated collection of AI engineering prompts to inspire creators, designers, and developers. Our mission is to empower individuals and teams by providing the ultimate foundation for AI-driven art, code, and textual generation.

AI Prompt Matrix originated from the realization that crafting the perfect prompt is half the battle; an AI tool is only as powerful as the given instructions. We meticulously test, refine, and categorize every prompt, ensuring you can focus on building and creating rather than trial and error.

## Our Mission

To democratize access to high-quality AI prompts. We believe that AI should be accessible to everyone, and a major barrier to entry is knowing how to talk to these models. By providing a curated library of battle-tested prompts, we aim to bridge the gap between human imagination and AI execution.

## What Makes Us Different

- **Meticulously Curated**: We don't just accept any prompt. Every submission goes through a review process to ensure it produces consistent, high-quality results across different generations.
- **Ready to Use**: Our prompts come with clear instructions, variable placeholders, and example outputs so you can integrate them into your workflow immediately.
- **Cross-Model Compatibility**: Where possible, we optimize prompts to work across multiple models, or clearly label which specific version a prompt is designed for.
- **Community Driven**: We foster a community of creators who share their knowledge, refine each other's prompts, and discover new use cases together.
`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">About Us</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          Discover our mission, our story, and what makes this platform the ultimate destination for AI creators.
        </p>
      </div>
      <div className="bg-white dark:bg-surface-900 shadow-xl shadow-surface-200/20 dark:shadow-none border border-surface-200 dark:border-surface-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{settings.pageAbout || defaultContent}</Markdown>
        </div>
      </div>
    </div>
  );
}
