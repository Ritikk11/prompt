import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'contact', settings.pageContact, '');
  return staticPageMetadata(page);
}

export default async function Contact() {
  const settings = await fetchSettings();
  
  const contactEmail = settings.contactEmail || 'support@aipromptmatrix.in';
  const defaultContent = `
# Contact Us

We read messages about corrections, copyright concerns, prompt submissions, partnerships, and site feedback.

**Email:** [${contactEmail}](mailto:${contactEmail})  
**Typical response time:** 2-5 business days

## What To Include

- The page URL if your message is about a specific prompt or image.
- A short explanation of what needs to be fixed or reviewed.
- For copyright or DMCA matters, include enough detail for us to identify the material.
- For partnerships, include your website or public profile.

## Prompt Corrections

If a prompt has the wrong tool, model, tags, title, or image, send us the page link and the correction. We review correction requests and update pages when the change improves clarity.

## Copyright Or Removal Requests

For copyright notices, please use the DMCA Notice page and email the required details to **${contactEmail}**.

## Submitting Prompts

If submissions are enabled, you can submit prompts from the Submit page. Approved submissions may be edited for formatting, tags, clarity, and page quality before publication.
`;
  const page = getStaticPageContent(settings, 'contact', settings.pageContact, defaultContent);
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
