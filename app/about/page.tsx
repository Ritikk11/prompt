export const runtime = 'edge';

import { Sparkles, Image as ImageIcon, Users, Rocket, CheckCircle, Cpu, User } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-4xl md:text-6xl font-black mb-8 text-surface-900 dark:text-white text-center">About Us</h1>
      
      <div className="mb-16 text-center max-w-3xl mx-auto space-y-6">
        <p className="text-lg md:text-xl text-surface-600 dark:text-surface-300">
          We are dedicated to building the largest and most curated collection of AI engineering prompts to inspire creators, designers, and developers.
          Our mission is to empower individuals and teams by providing the ultimate foundation for AI-driven art, code, and textual generation. 
        </p>
        <p className="text-lg md:text-xl text-surface-600 dark:text-surface-300">
          AI Prompt Matrix originated from the realization that crafting the perfect prompt is half the battle; an AI tool is only as powerful as the given instructions. We meticulously test, refine, and categorize every prompt, ensuring you can focus on building and creating rather than trial and error.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-6 text-center text-surface-900 dark:text-white">Our Mission</h2>
        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 p-8 rounded-3xl border border-primary-500/20">
          <p className="text-lg text-surface-700 dark:text-surface-300 leading-relaxed text-center">
            To democratize access to high-quality AI prompts. We believe that AI should be accessible to everyone, and a major barrier to entry is knowing how to talk to these models. By providing a curated library of battle-tested prompts, we aim to bridge the gap between human imagination and AI execution.
          </p>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center text-surface-900 dark:text-white">What Makes Us Different</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4 p-6 bg-surface-50 dark:bg-surface-800 rounded-2xl">
            <CheckCircle className="w-8 h-8 text-primary-500 shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">Meticulously Curated</h3>
              <p className="text-surface-600 dark:text-surface-300 text-sm">We don't just accept any prompt. Every submission goes through a review process to ensure it produces consistent, high-quality results across different generations.</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-surface-50 dark:bg-surface-800 rounded-2xl">
            <Rocket className="w-8 h-8 text-primary-500 shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">Ready to Use</h3>
              <p className="text-surface-600 dark:text-surface-300 text-sm">Our prompts come with clear instructions, variable placeholders, and example outputs so you can integrate them into your workflow immediately.</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-surface-50 dark:bg-surface-800 rounded-2xl">
            <Cpu className="w-8 h-8 text-primary-500 shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">Cross-Model Compatibility</h3>
              <p className="text-surface-600 dark:text-surface-300 text-sm">Where possible, we optimize prompts to work across multiple models, or clearly label which specific version a prompt is designed for.</p>
            </div>
          </div>
           <div className="flex gap-4 p-6 bg-surface-50 dark:bg-surface-800 rounded-2xl">
            <Users className="w-8 h-8 text-primary-500 shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">Community Driven</h3>
              <p className="text-surface-600 dark:text-surface-300 text-sm">We foster a community of creators who share their knowledge, refine each other's prompts, and discover new use cases together.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center text-surface-900 dark:text-white">AI Tools We Support</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Leonardo AI', 'ChatGPT', 'Claude', 'Gemini', 'Runway Gen-2'].map(tool => (
            <div key={tool} className="p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-center font-medium shadow-sm">
              {tool}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center text-surface-900 dark:text-white">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Alex', role: 'Founder & AI Researcher' },
            { name: 'Sarah', role: 'Prompt Engineer' },
            { name: 'David', role: 'Community Manager' }
          ].map(member => (
            <div key={member.name} className="text-center">
              <div className="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-200 dark:border-surface-700">
                <User className="w-10 h-10 text-surface-400" />
              </div>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-primary-500 text-sm">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
