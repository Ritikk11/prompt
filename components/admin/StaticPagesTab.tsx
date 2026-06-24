'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SiteSettings, StaticPageSettings } from '@/lib/types';
import { Info, Save } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const MARKDOWN_HELP_EXAMPLE = `## Main section
### Question style heading

:::tip
Use short, useful callouts.
:::

:::important
Put important notes here.
:::

Inline styles: {mark:highlight}, {primary:primary}, {green:good}, {red:avoid}.`;

const pageKeys = ['about', 'contact', 'privacy', 'terms', 'dmca', 'disclaimer'] as const;
type PageKey = typeof pageKeys[number];
const pageLabels: Record<PageKey, string> = {
  about: 'About Us',
  contact: 'Contact',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  dmca: 'DMCA',
  disclaimer: 'Disclaimer',
};
function pageDefaults(key: PageKey): StaticPageSettings {
  const defaultBodies: Record<PageKey, string> = {
    about: `# About Us

AI PromptMatrix is a curated prompt library for creators who want practical AI image prompts, real examples, model notes, and reusable creative workflows in one place.

## Our Mission

Our mission is to make AI image prompting easier to understand, test, and reuse. We organize prompts by tools, tags, sections, and creative direction so visitors can move from inspiration to generation quickly.

## What Makes Us Different

- Curated prompt collections instead of a raw feed.
- Clear AI tool and model context where available.
- Visual examples that show what each prompt is trying to create.
- Editorial review for titles, tags, clarity, and usefulness.

## Contact

For corrections, copyright concerns, partnerships, or general questions, use the Contact page.`,
    contact: `# Contact Us

We read messages about corrections, copyright concerns, prompt submissions, partnerships, and site feedback.

**Email:** support@aipromptmatrix.in

## What To Include

- The page URL if your message is about a specific prompt or image.
- A short explanation of what needs to be fixed or reviewed.
- For copyright or DMCA matters, include enough detail for us to identify the material.
- For partnerships, include your website or public profile.`,
    privacy: `# Privacy Policy

This Privacy Policy explains how AI PromptMatrix collects, uses, and protects information when visitors use the website.

## Information We Collect

We may collect information you provide directly, basic usage information, and technical data needed to operate and improve the site.

## How We Use Information

We use information to operate the website, review submissions, improve content quality, respond to messages, and protect the platform.

## Contact

For privacy questions, contact us through the Contact page.`,
    terms: `# Terms of Service

By using AI PromptMatrix, you agree to use the website responsibly and only for lawful purposes.

## Content

Prompts, images, and examples are provided for creative and informational use. AI output can vary between tools, models, and sessions.

## Acceptable Use

Do not misuse the website, submit unlawful content, copy protected work without rights, or interfere with site operations.

## Changes

We may update these terms as the website changes.`,
    dmca: `# DMCA Notice

AI PromptMatrix respects intellectual property rights. If you believe content on this site infringes your copyright, send a notice with enough information for us to identify and review the material.

## Include

- The copyrighted work.
- The URL of the allegedly infringing material.
- Your contact information.
- A good-faith statement and signature.

Use the Contact page for copyright and removal requests.`,
    disclaimer: `# Disclaimer

AI PromptMatrix provides prompts, images, examples, and notes for general creative and informational purposes.

AI-generated results can vary. We do not guarantee that using a prompt will reproduce the same image, style, quality, or result in every model.

The website may link to third-party tools or services. We are not responsible for third-party content, policies, or outputs.`,
  };
  return {
    title: pageLabels[key],
    subtitle: '',
    body: defaultBodies[key],
    metaTitle: `${pageLabels[key]} | AI PromptMatrix`,
    metaDescription: '',
    ogImage: '',
    visible: true,
  };
}

export default function StaticPagesTab({ settings, updateSettings }: { settings: SiteSettings, updateSettings: (s: SiteSettings) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageAbout, setPageAbout] = useState(settings.staticPages?.about?.body || settings.pageAbout || pageDefaults('about').body || '');
  const [pagePrivacy, setPagePrivacy] = useState(settings.staticPages?.privacy?.body || settings.pagePrivacy || pageDefaults('privacy').body || '');
  const [pageTerms, setPageTerms] = useState(settings.staticPages?.terms?.body || settings.pageTerms || pageDefaults('terms').body || '');
  const [pageDmca, setPageDmca] = useState(settings.staticPages?.dmca?.body || settings.pageDmca || pageDefaults('dmca').body || '');
  const [pageDisclaimer, setPageDisclaimer] = useState(settings.staticPages?.disclaimer?.body || settings.pageDisclaimer || pageDefaults('disclaimer').body || '');
  const [pageContact, setPageContact] = useState(settings.staticPages?.contact?.body || settings.pageContact || pageDefaults('contact').body || '');
  const [staticPages, setStaticPages] = useState<Record<string, StaticPageSettings>>(() => settings.staticPages || {});

  const initialPage = pageKeys.includes(searchParams.get('page') as PageKey) ? searchParams.get('page') as PageKey : 'about';
  const [activeTab, setActiveTabState] = useState<PageKey>(initialPage);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showHelp, setShowHelp] = useState(false);

  const setActiveTab = (nextPage: PageKey) => {
    setActiveTabState(nextPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'pages');
    params.set('page', nextPage);
    router.push(`/admin?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const nextPage = searchParams.get('page') as PageKey;
    if (pageKeys.includes(nextPage)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTabState(nextPage);
    }
  }, [searchParams]);

  const handleSave = () => {
    const bodyByPage = {
      about: pageAbout,
      contact: pageContact,
      privacy: pagePrivacy,
      terms: pageTerms,
      dmca: pageDmca,
      disclaimer: pageDisclaimer,
    };
    const nextStaticPages = Object.fromEntries(
      pageKeys.map(key => [
        key,
        {
          ...pageDefaults(key),
          ...(staticPages[key] || {}),
          body: bodyByPage[key],
        },
      ])
    ) as Record<string, StaticPageSettings>;
    updateSettings({
      ...settings,
      pageAbout,
      pagePrivacy,
      pageTerms,
      pageDmca,
      pageDisclaimer,
      pageContact,
      staticPages: nextStaticPages,
    });
    setStaticPages(nextStaticPages);
    alert('Pages updated.');
  };

  const textareas = {
    about: { label: pageLabels.about, value: pageAbout, set: setPageAbout },
    contact: { label: pageLabels.contact, value: pageContact, set: setPageContact },
    privacy: { label: pageLabels.privacy, value: pagePrivacy, set: setPagePrivacy },
    terms: { label: pageLabels.terms, value: pageTerms, set: setPageTerms },
    dmca: { label: pageLabels.dmca, value: pageDmca, set: setPageDmca },
    disclaimer: { label: pageLabels.disclaimer, value: pageDisclaimer, set: setPageDisclaimer }
  };
  const currentPage = {
    ...pageDefaults(activeTab),
    ...(staticPages[activeTab] || {}),
    body: (staticPages[activeTab]?.body || textareas[activeTab].value || pageDefaults(activeTab).body || ''),
  };
  const updateCurrentPage = (patch: StaticPageSettings) => {
    setStaticPages(prev => ({
      ...prev,
      [activeTab]: {
        ...pageDefaults(activeTab),
        ...(prev[activeTab] || {}),
        ...patch,
      },
    }));
  };

  return (
    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Static Pages Content</h2>
          <p className="text-sm text-surface-500 mt-1">Manage content using Markdown formatting.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25">
          <Save className="w-4 h-4" /> Save Content
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {(Object.keys(textareas) as Array<keyof typeof textareas>).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === key ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'}`}
          >
            {textareas[key].label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-surface-200 bg-surface-50/70 p-3 dark:border-surface-800 dark:bg-surface-950/40 sm:p-4">
        <div className="mb-4 grid gap-3 rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Page title (H1)</label>
            <input
              value={currentPage.title || ''}
              onChange={e => updateCurrentPage({ title: e.target.value })}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
              placeholder={textareas[activeTab].label}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">OG image</label>
            <input
              value={currentPage.ogImage || ''}
              onChange={e => updateCurrentPage({ ogImage: e.target.value })}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-surface-500 mb-1">Hero subtitle / intro text</label>
            <textarea
              value={currentPage.subtitle || ''}
              onChange={e => updateCurrentPage({ subtitle: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Meta title</label>
            <input
              value={currentPage.metaTitle || ''}
              onChange={e => updateCurrentPage({ metaTitle: e.target.value.slice(0, 80) })}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
            />
            <p className="mt-1 text-[11px] text-surface-500">{(currentPage.metaTitle || '').length}/80</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Meta description</label>
            <textarea
              value={currentPage.metaDescription || ''}
              onChange={e => updateCurrentPage({ metaDescription: e.target.value.slice(0, 170) })}
              rows={2}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
            />
            <p className="mt-1 text-[11px] text-surface-500">{(currentPage.metaDescription || '').length}/170</p>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={currentPage.visible !== false}
                onChange={e => updateCurrentPage({ visible: e.target.checked })}
                className="h-4 w-4 rounded text-primary-500"
              />
              Show this page publicly
            </label>
            <button
              type="button"
              onClick={() => window.open(`/${activeTab}`, '_blank')}
              className="rounded-lg bg-surface-100 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200"
            >
              Preview
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-medium">{textareas[activeTab].label} (Markdown Format)</label>
          <div className="flex flex-wrap gap-2">
            <div className="grid grid-cols-2 rounded-xl bg-white p-1 text-xs font-semibold dark:bg-surface-800">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${mode === 'edit' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-500'}`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${mode === 'preview' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-500'}`}
              >
                Preview
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(prev => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-surface-600 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
            >
              <Info className="h-3.5 w-3.5" />
              Formatting
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mb-3 grid gap-3 rounded-xl border border-primary-200 bg-white p-3 text-xs dark:border-primary-800/40 dark:bg-surface-900 md:grid-cols-2">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-950 p-3 font-mono text-[11px] leading-relaxed text-surface-50">{MARKDOWN_HELP_EXAMPLE}</pre>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer>{MARKDOWN_HELP_EXAMPLE}</MarkdownRenderer>
            </div>
          </div>
        )}

        {mode === 'edit' ? (
          <textarea
            value={textareas[activeTab].value}
            onChange={e => textareas[activeTab].set(e.target.value)}
            rows={20}
            className="w-full resize-y rounded-xl border border-surface-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800/50"
            placeholder={`# ${textareas[activeTab].label}\n\nEnter content here...`}
          />
        ) : (
          <div className="min-h-[420px] rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900 sm:p-6">
            {textareas[activeTab].value.trim() ? (
              <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base">
                <MarkdownRenderer>{textareas[activeTab].value}</MarkdownRenderer>
              </div>
            ) : (
              <p className="text-sm text-surface-400">Preview will appear here as you write.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
