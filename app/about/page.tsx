export const runtime = 'edge';


import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'about', settings.pageAbout, '');
  return staticPageMetadata(page);
}

export default async function About() {
  const settings = await fetchSettings();
  
  const contactEmail = settings.contactEmail || 'support@aipromptmatrix.in';
  const defaultContent = `
# About Us

AI PromptMatrix is a curated prompt library for creators who want practical AI image prompts, real examples, model notes, and reusable creative workflows in one place.

The site exists because prompt discovery is often messy. A useful prompt is not just a block of text. It needs context: which tool it was made for, what kind of image it produced, what tags or style direction it belongs to, and how someone can adapt it without starting from zero.

## Our Mission

Our mission is to make AI image prompting easier to understand, test, and reuse. We organize prompts by tools, tags, sections, and creative direction so visitors can move from inspiration to generation quickly.

## What Makes Us Different

- **Curated structure:** Prompts are grouped by tool, topic, style, and use case instead of being left as a raw feed.
- **Clear model context:** Prompt pages show the intended AI tool and model where available.
- **Example-first browsing:** Visual examples help visitors understand what a prompt is trying to create before they copy it.
- **Reusable workflows:** Many pages include prompt text, notes, tags, related prompts, and follow-up discovery blocks.
- **Editorial review:** Public pages are organized and reviewed so the library remains useful for creators, not just searchable.

## How We Review Content

Before a prompt is featured or organized into a section, we look for clear titles, useful descriptions, visible example images, correct tool labels, and clean tags. We also remove or avoid content that is misleading, broken, unsafe, or too vague to help visitors.

## Who This Site Is For

AI PromptMatrix is built for creators, designers, social media editors, prompt writers, students, and anyone experimenting with AI image generation. The goal is not to promise identical outputs every time. AI tools can vary. The goal is to give you a stronger starting point and a clearer direction.

## Contact

For corrections, copyright concerns, partnerships, or general questions, contact us at **${contactEmail}**.
`;
  const page = getStaticPageContent(settings, 'about', settings.pageAbout, defaultContent);
  if (!page.visible) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">{page.title}</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          {page.subtitle}
        </p>
      </div>
      <div className="bg-white dark:bg-surface-900 shadow-xl shadow-surface-200/20 dark:shadow-none border border-surface-200 dark:border-surface-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{page.body}</Markdown>
        </div>
      </div>
    </div>
  );
}
