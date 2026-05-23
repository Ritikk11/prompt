export const runtime = 'edge';
import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';

export default async function Contact() {
  const settings = await fetchSettings();
  
  const defaultContent = `
# Contact Us

We would love to hear from you! Please feel free to reach out using any of the methods below.

**Email**: hello@example.com  
**Support Hours**: Monday - Friday, 9am - 5pm EST

## Frequently Asked Questions

Before reaching out, considering checking if your question is answered below:

### How do I submit a prompt?

You can submit an AI prompt by creating an account and navigating to the "Submit" section in the main menu. Make sure to adhere to our submission guidelines to get your prompt approved quickly.

### An AI tool generated something unexpected, how do I fix it?

Different models behave differently even with the same text phrase. Consider adjusting the "seed" or exploring variations of the prompt keywords if the model is not providing the style you desire.

## Media Inquiries

For press and media partnerships, please prefix your email subject with **[PRESS]**.
`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">Contact Us</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          Have a question or want to work together? We'd love to hear from you.
        </p>
      </div>
      <div className="bg-white dark:bg-surface-900 shadow-xl shadow-surface-200/20 dark:shadow-none border border-surface-200 dark:border-surface-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{settings.pageContact || defaultContent}</Markdown>
        </div>
      </div>
    </div>
  );
}
