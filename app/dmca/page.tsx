import { fetchSettings } from '@/lib/data';
import Markdown from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { getStaticPageContent, staticPageMetadata, getDefaultStaticPageBody } from '@/lib/static-pages';

export async function generateMetadata() {
  const settings = await fetchSettings();
  const page = getStaticPageContent(settings, 'dmca', settings.pageDmca, '');
  return staticPageMetadata(page, settings);
}

export default async function Dmca() {
  const settings = await fetchSettings();
  const defaultContent = getDefaultStaticPageBody('dmca', settings);
  const page = getStaticPageContent(settings, 'dmca', settings.pageDmca, defaultContent);
  if (!page.visible) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-surface-900 dark:text-white">{page.title}</h1>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          {page.subtitle}
        </p>
      </div>
      <div className="bg-white/60 dark:bg-white/[0.08] shadow-xl shadow-surface-200/20 dark:shadow-none border border-white/80 dark:border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-xl backdrop-saturate-150">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-2xl relative z-10">
          <Markdown>{page.body}</Markdown>
        </div>
      </div>
    </div>
  );
}
