import Link from 'next/link';
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import type { Article } from '@/lib/content/types';
import { getRelatedArticlesForSettings } from '@/lib/content';
import type { SiteSettings } from '@/lib/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ArticleCard, { formatArticleDate } from '@/components/ArticleCard';
import ArticleThumbnail from '@/components/ArticleThumbnail';
import ScrollReveal from '@/components/ScrollReveal';

function extractFaqsFromMarkdown(markdown: string) {
  const faqs: { question: string; answer: string }[] = [];
  const faqSectionRegex = /##\s*Frequently Asked Questions\s*([\s\S]*?)(?=##\s|$)/i;
  const match = markdown.match(faqSectionRegex);
  
  if (match && match[1]) {
    const faqContent = match[1];
    const questionBlocks = faqContent.split(/###\s+/).filter(Boolean);
    
    for (const block of questionBlocks) {
      const lines = block.split(/\r?\n/);
      const question = lines[0].trim();
      const answer = lines.slice(1).join('\n').trim();
      
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }
  return faqs;
}

export default function ArticlePage({ article, siteUrl, settings, thumbnailUrl }: { article: Article; siteUrl: string; settings?: SiteSettings; thumbnailUrl?: string }) {
  const isGuide = article.category === 'guide';
  const listHref = isGuide ? '/guides' : '/blog';
  const listLabel = isGuide ? 'All guides' : 'All articles';
  const related = getRelatedArticlesForSettings(article, settings, 3);

  const rawLogo = settings?.siteLogo || '/icon-256x256.jpg';
  const publisherLogoUrl = rawLogo.startsWith('http') || rawLogo.startsWith('data:')
    ? rawLogo
    : `${siteUrl}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: { '@type': 'Organization', name: 'AI PromptMatrix Editorial Team', url: `${siteUrl}/about` },
    publisher: {
      '@type': 'Organization',
      name: 'AI PromptMatrix',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: publisherLogoUrl },
    },
    mainEntityOfPage: `${siteUrl}${listHref}/${article.slug}`,
    ...((thumbnailUrl || article.thumbnailUrl) ? {
      image: {
        '@type': 'ImageObject',
        url: thumbnailUrl || article.thumbnailUrl,
        contentUrl: thumbnailUrl || article.thumbnailUrl,
        name: article.title,
        creator: {
          '@type': 'Organization',
          name: 'AI PromptMatrix',
          url: siteUrl,
        },
        creditText: 'AI PromptMatrix',
        license: `${siteUrl}/terms`,
        acquireLicensePage: `${siteUrl}/contact`,
        copyrightNotice: `© ${new Date().getFullYear()} AI PromptMatrix`,
      },
    } : {}),
  };

  const faqs = extractFaqsFromMarkdown(article.body || '');
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  let breadcrumbJsonLd = null;
  if (settings?.seoSettings?.enableBreadcrumbList !== false) {
    const breadcrumbLabel = isGuide ? 'Guides' : 'Blog';
    breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: breadcrumbLabel,
          item: `${siteUrl}${listHref}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `${siteUrl}${listHref}/${article.slug}`,
        }
      ],
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <Link href={listHref} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-500 hover:text-primary-600">
        <ArrowLeft className="h-3.5 w-3.5" /> {listLabel}
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-surface-950 dark:text-white md:text-4xl">{article.title}</h1>
      <p className="mt-4 text-base leading-8 text-surface-600 dark:text-surface-400">{article.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-white/80 pb-6 text-xs font-bold uppercase tracking-wider text-surface-400 dark:border-white/10 dark:text-surface-500">
        <span>{formatArticleDate(article.datePublished)}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readMinutes} min read</span>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">{isGuide ? 'Guide' : 'Blog'}</span>
      </div>

      <div className="mt-8">
        <ArticleThumbnail article={article} thumbnailUrl={thumbnailUrl} />
      </div>

      <article className="prose prose-surface mt-8 max-w-4xl dark:prose-invert prose-p:leading-8">
        <MarkdownRenderer>{article.body}</MarkdownRenderer>
      </article>

      <div className="mt-12 rounded-3xl border border-primary-200 bg-primary-50/60 p-6 text-center dark:border-primary-500/30 dark:bg-primary-900/20">
        <h2 className="text-xl font-black text-surface-950 dark:text-white">Ready to try it yourself?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-surface-600 dark:text-surface-400">
          Browse copy-ready prompts with example images, model notes, and the exact text behind each result.
        </p>
        <Link href="/explore" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-black text-white transition hover:bg-primary-600">
          Explore prompts <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 text-2xl font-black tracking-tight text-surface-950 dark:text-white">Keep reading</h2>
          <ScrollReveal>
            <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(item => (
                <ArticleCard key={item.slug} article={item} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
