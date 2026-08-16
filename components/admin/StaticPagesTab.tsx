'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SiteSettings, StaticPageSettings } from '@/lib/types';
import { FileText, Info, Save } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { WandButton } from '@/components/admin/MagicWand';
import { showToast } from '@/components/ui/ToastContainer';
import { staticPagePrompts } from '@/lib/admin/wandPrompts';
import { TabBanner, Panel, PanelHeader, SectionEyebrow, Field, CharCount, adminInput } from '@/components/admin/AdminUI';

const MARKDOWN_HELP_EXAMPLE = `## Main section
### Question style heading

:::tip Keep callouts short
Use short, useful callouts. The text after the type becomes the label; leave it off for an untitled block.
:::

:::important
Put important notes here.
:::

Inline styles: {mark:highlight}, {primary:primary}, {green:good}, {red:avoid}.`;

import { getDefaultStaticPageBody } from '@/lib/static-pages';

const pageKeys = ['about', 'contact', 'privacy', 'terms', 'dmca', 'disclaimer', 'cookies'] as const;
type PageKey = typeof pageKeys[number];
const pageLabels: Record<PageKey, string> = {
  about: 'About Us',
  contact: 'Contact',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  dmca: 'DMCA',
  disclaimer: 'Disclaimer',
  cookies: 'Cookies Policy',
};
function pageDefaults(key: PageKey, settings?: SiteSettings): StaticPageSettings {
  return {
    title: pageLabels[key],
    subtitle: '',
    body: getDefaultStaticPageBody(key, settings),
    metaTitle: `${pageLabels[key]} | AI PromptMatrix`,
    metaDescription: '',
    ogImage: '',
    visible: true,
  };
}

export default function StaticPagesTab({ settings, updateSettings }: { settings: SiteSettings, updateSettings: (s: SiteSettings) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageAbout, setPageAbout] = useState(settings.staticPages?.about?.body || settings.pageAbout || pageDefaults('about', settings).body || '');
  const [pagePrivacy, setPagePrivacy] = useState(settings.staticPages?.privacy?.body || settings.pagePrivacy || pageDefaults('privacy', settings).body || '');
  const [pageTerms, setPageTerms] = useState(settings.staticPages?.terms?.body || settings.pageTerms || pageDefaults('terms', settings).body || '');
  const [pageDmca, setPageDmca] = useState(settings.staticPages?.dmca?.body || settings.pageDmca || pageDefaults('dmca', settings).body || '');
  const [pageDisclaimer, setPageDisclaimer] = useState(settings.staticPages?.disclaimer?.body || settings.pageDisclaimer || pageDefaults('disclaimer', settings).body || '');
  const [pageContact, setPageContact] = useState(settings.staticPages?.contact?.body || settings.pageContact || pageDefaults('contact', settings).body || '');
  const [pageCookies, setPageCookies] = useState(settings.staticPages?.cookies?.body || settings.pageCookies || pageDefaults('cookies', settings).body || '');
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
      cookies: pageCookies,
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
      pageCookies,
      staticPages: nextStaticPages,
    });
    setStaticPages(nextStaticPages);
    showToast('Pages updated.');
  };

  const textareas = {
    about: { label: pageLabels.about, value: pageAbout, set: setPageAbout },
    contact: { label: pageLabels.contact, value: pageContact, set: setPageContact },
    privacy: { label: pageLabels.privacy, value: pagePrivacy, set: setPagePrivacy },
    terms: { label: pageLabels.terms, value: pageTerms, set: setPageTerms },
    dmca: { label: pageLabels.dmca, value: pageDmca, set: setPageDmca },
    disclaimer: { label: pageLabels.disclaimer, value: pageDisclaimer, set: setPageDisclaimer },
    cookies: { label: pageLabels.cookies, value: pageCookies, set: setPageCookies }
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
    <div className="space-y-6 fade-in">
      <TabBanner
        icon={<FileText />}
        title="Static pages"
        text="Edit the hero, search appearance, and markdown body of each public page, then save to publish."
        action={
          <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors">
            <Save className="w-4 h-4" /> Save content
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(textareas) as Array<keyof typeof textareas>).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${activeTab === key
              ? 'border-primary-500/50 bg-primary-50/10 dark:bg-primary-950/10 text-primary-600 dark:text-primary-400 shadow-md'
              : 'border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-700'}`}
          >
            {textareas[key].label}
          </button>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title={textareas[activeTab].label}
          subtitle="Hero, search appearance, and markdown body for this page."
          actions={
            <>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-surface-700 dark:text-surface-300">
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
                className="rounded-xl px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
              >
                Open page
              </button>
            </>
          }
        />

        <div className="space-y-4">
          <SectionEyebrow>1. Hero content</SectionEyebrow>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Page title (H1)">
              <input
                value={currentPage.title || ''}
                onChange={e => updateCurrentPage({ title: e.target.value })}
                className={adminInput}
                placeholder={textareas[activeTab].label}
              />
            </Field>
            <Field
              label="Hero subtitle / intro text"
              className="md:col-span-2"
              action={
                <WandButton
                  fieldId={`page-subtitle-${activeTab}`}
                  value={currentPage.subtitle || ''}
                  onChange={(v) => updateCurrentPage({ subtitle: v })}
                  prompt={() => staticPagePrompts.heroSubtitle(activeTab, textareas[activeTab].label)}
                />
              }
            >
              <textarea
                value={currentPage.subtitle || ''}
                onChange={e => updateCurrentPage({ subtitle: e.target.value })}
                rows={2}
                className={adminInput}
              />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <SectionEyebrow>2. Search appearance</SectionEyebrow>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Meta title"
              action={
                <WandButton
                  fieldId={`page-meta-title-${activeTab}`}
                  value={currentPage.metaTitle || ''}
                  onChange={(v) => updateCurrentPage({ metaTitle: v.slice(0, 80) })}
                  prompt={() => staticPagePrompts.metaTitle(activeTab, textareas[activeTab].label)}
                />
              }
            >
              <input
                value={currentPage.metaTitle || ''}
                onChange={e => updateCurrentPage({ metaTitle: e.target.value.slice(0, 80) })}
                className={adminInput}
              />
              <CharCount value={currentPage.metaTitle || ''} recommended={60} />
            </Field>
            <Field
              label="Meta description"
              action={
                <WandButton
                  fieldId={`page-meta-desc-${activeTab}`}
                  value={currentPage.metaDescription || ''}
                  onChange={(v) => updateCurrentPage({ metaDescription: v.slice(0, 170) })}
                  prompt={() => staticPagePrompts.metaDescription(activeTab, textareas[activeTab].label)}
                />
              }
            >
              <textarea
                value={currentPage.metaDescription || ''}
                onChange={e => updateCurrentPage({ metaDescription: e.target.value.slice(0, 170) })}
                rows={2}
                className={adminInput}
              />
              <CharCount value={currentPage.metaDescription || ''} recommended={160} />
            </Field>
            <Field label="OG image" className="md:col-span-2">
              <input
                value={currentPage.ogImage || ''}
                onChange={e => updateCurrentPage({ ogImage: e.target.value })}
                className={adminInput}
                placeholder="https://..."
              />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionEyebrow>3. Page body</SectionEyebrow>
            <div className="flex flex-wrap items-center gap-2">
              <WandButton
                fieldId={`page-body-${activeTab}`}
                value={textareas[activeTab].value}
                onChange={(v) => textareas[activeTab].set(v)}
                prompt={() => staticPagePrompts.body(activeTab, textareas[activeTab].label)}
                size="sm"
              />
              <button
                type="button"
                onClick={() => textareas[activeTab].set(getDefaultStaticPageBody(activeTab, settings))}
                title="Replace this body with the built-in default, regenerated with your current site name and email. Save to apply."
                className="rounded-xl px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors"
              >
                Reset to default
              </button>
              <div className="grid grid-cols-2 rounded-xl bg-surface-100 dark:bg-surface-800 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${mode === 'edit' ? 'bg-primary-500 text-white' : 'text-surface-500'}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setMode('preview')}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${mode === 'preview' ? 'bg-primary-500 text-white' : 'text-surface-500'}`}
                >
                  Preview
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                Formatting
              </button>
            </div>
          </div>

          {showHelp && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-primary-200 bg-primary-50/60 p-3 text-xs dark:border-primary-800/40 dark:bg-primary-950/20 md:grid-cols-2">
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
              className={`${adminInput} resize-y font-mono leading-relaxed`}
              placeholder={`# ${textareas[activeTab].label}\n\nEnter content here...`}
            />
          ) : (
            <div className="min-h-[420px] rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-800/40 p-4 sm:p-6">
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
      </Panel>
    </div>
  );
}
