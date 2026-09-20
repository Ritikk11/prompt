'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, X, Save, Search, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import type { SeoSettings, SiteSettings } from '@/lib/types';
import { WandButton } from '@/components/admin/MagicWand';
import { seoPrompts } from '@/lib/admin/wandPrompts';
import { TabBanner, Panel, PanelHeader, SectionEyebrow, Field, EditableCard, CharCount, Toggle, AdminSelect, adminInput } from '@/components/admin/AdminUI';
import { showToast } from '@/components/ui/ToastContainer';
import { confirmAction } from '@/components/ui/ConfirmDialog';

type SeoPagesTabMode = 'global' | 'pages' | 'all';


async function adminRequest(payload?: any, searchParams?: Record<string, string>) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (payload) headers['Content-Type'] = 'application/json';
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  let url = '/api/admin';
  if (searchParams) {
    const q = new URLSearchParams(searchParams).toString();
    if (q) url += `?${q}`;
  }

  const res = await fetch(url, {
    method: payload ? 'POST' : 'GET',
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Admin request failed');
  return json;
}

const defaultSeoSettings: SeoSettings = {
  metaTitleTemplate: '%post_title%',
  defaultMetaDescription: '',
  defaultOgImage: '',
  twitterHandle: '',
  googleVerification: '',
  bingVerification: '',
  pinterestVerification: '',
  robotsText: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\n\nSitemap: https://promptsoul.in/sitemap.xml\nSitemap: https://promptsoul.in/sitemap-prompts.xml',
  sitemapInclude: { posts: true, sections: true, tags: true, tools: true, staticPages: true },
  enableJsonLd: true,
  schemaType: 'Article',
  enableBreadcrumbList: true,
  alternateSiteNames: ['PromptSoul', 'Prompt Soul', 'Promptsoul', 'prompt soul'],
  indexNowKey: 'd2725a72cddd4faba71fcc50a0d414cc',
  enableIndexNow: true,
  redirects: [],
};

export default function SeoPagesTab({ settings, updateSettings, mode = 'all' }: { settings?: SiteSettings; updateSettings?: (s: SiteSettings) => void; mode?: SeoPagesTabMode }) {
  const [seoPages, setSeoPages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPingingIndexNow, setIsPingingIndexNow] = useState(false);

  const handlePingIndexNow = async () => {
    setIsPingingIndexNow(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ mode: 'recent' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(data.message || 'Successfully submitted recent URLs to IndexNow!', 'success');
      } else {
        showToast(data.message || data.error || 'Failed to ping IndexNow', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting to IndexNow', 'error');
    } finally {
      setIsPingingIndexNow(false);
    }
  };

  const [title, setTitle] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBadge, setHeroBadge] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [introContent, setIntroContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [categoriesStr, setCategoriesStr] = useState('');
  const [aiToolsStr, setAiToolsStr] = useState('');
  const [filterTagsStr, setFilterTagsStr] = useState('');
  const [cardStyle, setCardStyle] = useState('');
  const [heroStyle, setHeroStyle] = useState<'container' | 'simple'>('container');
  const [loadingPages, setLoadingPages] = useState(true);
  const seoSettings = { ...defaultSeoSettings, ...(settings?.seoSettings || {}) };

  const updateSeoSettings = (patch: Partial<SeoSettings>) => {
    if (!settings || !updateSettings) return;
    updateSettings({
      ...settings,
      seoSettings: {
        ...seoSettings,
        ...patch,
        sitemapInclude: {
          ...seoSettings.sitemapInclude,
          ...(patch.sitemapInclude || {}),
        },
      },
    });
  };

  const fetchPages = useCallback(async () => {
    try {
      setLoadingPages(true);
      const data = await adminRequest(undefined, { resource: 'seopages' });
      setSeoPages(data.seopages || []);
    } catch (error) {
      console.error('SEO pages fetch error:', error);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const resetForm = () => {
    setTitle('');
    setHeroTitle('');
    setHeroDescription('');
    setHeroBadge('');
    setSeoTitle('');
    setSeoDescription('');
    setSlug('');
    setIntroContent('');
    setTagsStr('');
    setCategoriesStr('');
    setAiToolsStr('');
    setFilterTagsStr('');
    setCardStyle('');
    setHeroStyle('container');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (page: any) => {
    setTitle(page.title || '');
    setHeroTitle(page.heroTitle || '');
    setHeroDescription(page.heroDescription || '');
    setHeroBadge(page.heroBadge || '');
    setSeoTitle(page.seoTitle || '');
    setSeoDescription(page.seoDescription || '');
    setSlug(page.slug || '');
    setIntroContent(page.introContent || '');
    setTagsStr((page.tags || []).join(', '));
    setCategoriesStr((page.categories || []).join(', '));
    setAiToolsStr((page.aiTools || []).join(', '));
    setFilterTagsStr((page.filterTags || []).join(', '));
    setCardStyle(page.cardStyle || '');
    setHeroStyle(page.heroStyle === 'simple' ? 'simple' : 'container');
    setEditingId(page.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      showToast('Title and slug required', 'error');
      return;
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9-]+/g, '-');
    if (!cleanSlug) {
      showToast('Invalid slug format', 'error');
      return;
    }

    const id = editingId || Math.random().toString(36).substr(2, 9);
    const existing = seoPages.find(p => p.id === id);
    
    const data = {
      id,
      title: title.trim(),
      heroTitle: heroTitle.trim() || undefined,
      heroDescription: heroDescription.trim() || undefined,
      heroBadge: heroBadge.trim() || undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      slug: cleanSlug,
      introContent,
      tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
      categories: categoriesStr.split(',').map(s => s.trim()).filter(Boolean),
      aiTools: aiToolsStr.split(',').map(s => s.trim()).filter(Boolean),
      filterTags: filterTagsStr.split(',').map(s => s.trim()).filter(Boolean),
      cardStyle: cardStyle || undefined,
      heroStyle: heroStyle || 'container',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic update so the page appears immediately without delay
    setSeoPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = data;
        return next;
      }
      return [data, ...prev];
    });
    resetForm();
    showToast('SEO page saved successfully', 'success');

    // 2. Persist to server in background
    try {
      await adminRequest({ action: 'upsert', resource: 'seopages', id, data });
    } catch (e) {
      console.error('Error saving SEO page', e);
      showToast('Error saving SEO page to database', 'error');
      fetchPages();
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmAction({ title: 'Delete this SEO page?', message: 'The page and its settings will be permanently removed.', confirmLabel: 'Delete' }))) return;
    try {
      await adminRequest({ action: 'delete', resource: 'seopages', id });
      setSeoPages(prev => prev.filter(page => page.id !== id));
    } catch (e) {
      console.error(e);
      showToast('Error deleting', 'error');
    }
  };

  if (showForm) {
    return (
      <div className="max-w-2xl">
        <Panel>
          <PanelHeader
            title={editingId ? 'Edit SEO page' : 'Create SEO page'}
            subtitle="Landing page built from the prompts that match its rules"
            actions={
              <button onClick={resetForm} title="Close" className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"><X className="w-4 h-4" /></button>
            }
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-1">
              <SectionEyebrow>1. Page hero (visible on page)</SectionEyebrow>
              <Toggle
                checked={heroStyle !== 'simple'}
                onChange={(checked) => setHeroStyle(checked ? 'container' : 'simple')}
                label="Hero container"
              />
            </div>
            <Field
              label="Collection title (internal name & fallback)"
              action={
                <WandButton
                  fieldId="seo-page-heading"
                  value={title}
                  onChange={setTitle}
                  prompt={() => seoPrompts.pageHeading(slug, tagsStr)}
                />
              }
            >
              <input value={title} onChange={e => setTitle(e.target.value)} className={adminInput} placeholder="e.g. 80s Look Prompts" />
              <CharCount value={title} recommended={60} />
            </Field>
            <Field label="Hero heading (visible H1 on page, defaults to title)">
              <textarea rows={2} value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className={`${adminInput} resize-y`} placeholder="e.g. Trending 80s Look AI Prompts" />
              <CharCount value={heroTitle} recommended={60} />
            </Field>
            <Field label="Hero description (visible on page under H1)">
              <textarea value={heroDescription} onChange={e => setHeroDescription(e.target.value)} rows={3} className={`${adminInput} resize-y`} placeholder="Custom description shown on the live page hero..." />
            </Field>
            <Field label="Hero badge (optional, e.g. Collection, Trending, Curated)">
              <input value={heroBadge} onChange={e => setHeroBadge(e.target.value)} className={adminInput} placeholder="e.g. Curated Collection" />
            </Field>
            <Field label="URL Slug (path)">
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, ''))} className={adminInput} placeholder="e.g. trending-80s-look-ai-photo-prompts" />
              <p className="mt-1 text-xs text-surface-500">Live URL: promptsoul.in/{slug.replace(/^\/+/, '')}</p>
            </Field>
            <Field
              label="Intro content (optional, markdown guide shown below hero)"
              action={
                <WandButton
                  fieldId="seo-page-intro"
                  value={introContent}
                  onChange={setIntroContent}
                  prompt={() => seoPrompts.pageIntroContent(slug || title, tagsStr)}
                />
              }
            >
              <textarea value={introContent} onChange={e => setIntroContent(e.target.value)} rows={4} className={`${adminInput} resize-y`} placeholder="Short intro or guide shown above the matching prompt grid. Markdown is supported." />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>2. Search appearance (Google & Social)</SectionEyebrow>
            <Field
              label="SEO title (<title> tag for Google & Twitter)"
              action={
                <WandButton
                  fieldId="seo-page-seo-title"
                  value={seoTitle}
                  onChange={setSeoTitle}
                  prompt={() => seoPrompts.pageSeoTitle(slug || title, tagsStr)}
                />
              }
            >
              <textarea rows={2} value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className={`${adminInput} resize-y`} placeholder="Defaults to hero heading" />
              <CharCount value={seoTitle} recommended={60} />
              <p className="mt-1 text-xs text-surface-500">
                Write naturally with prepositions (e.g. <em>Viral 80s Look AI Prompts for Instagram &amp; ChatGPT</em>). Avoid stacking raw keywords without prepositions to prevent Google from replacing it with the H1.
              </p>
            </Field>
            <Field
              label="Meta description (Google snippet & social cards)"
              action={
                <WandButton
                  fieldId="seo-page-meta-desc"
                  value={seoDescription}
                  onChange={setSeoDescription}
                  prompt={() => seoPrompts.pageMetaDescription(slug || title, tagsStr)}
                />
              }
            >
              <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} className={`${adminInput} resize-y`} placeholder="Short search-result description for this page (120-160 chars)..." />
              <CharCount value={seoDescription} recommended={160} />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>3. Matching rules</SectionEyebrow>
            <Field label="Required tags (comma separated, all must match)">
              <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className={adminInput} placeholder="e.g. upscale, boys" />
            </Field>
            <Field label="Required categories (comma separated, all must match)">
              <input value={categoriesStr} onChange={e => setCategoriesStr(e.target.value)} className={adminInput} placeholder="e.g. image" />
            </Field>
            <Field label="Required AI tools (comma separated, all must match)">
              <input value={aiToolsStr} onChange={e => setAiToolsStr(e.target.value)} className={adminInput} placeholder="e.g. gemini, grok" />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>4. Display options</SectionEyebrow>
            <Field label="Filter rail tags (optional)">
              <input value={filterTagsStr} onChange={e => setFilterTagsStr(e.target.value)} className={adminInput} placeholder="e.g. character, anime, realistic" />
              <p className="mt-1 text-xs text-surface-500">Shows a horizontal tag selector above this page grid. Tags must match post tags.</p>
            </Field>
            <Field label="Card style (optional)">
              <AdminSelect value={cardStyle} onChange={setCardStyle} className={adminInput}>
                <option value="">Use global card style</option>
                <option value="v2">v2 (Redesign - Glass frost)</option>
                <option value="v1">v1 (Classic - Solid surface)</option>
              </AdminSelect>
              <p className="mt-1 text-xs text-surface-500">Choose card design for this landing page.</p>
            </Field>
          </div>

          <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors">
            <Save className="w-4 h-4" /> Save SEO page
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TabBanner
        icon={<Search />}
        title={mode === 'pages' ? 'SEO Landing Pages' : 'SEO'}
        text={
          mode === 'pages'
            ? 'Curated landing pages built from tag, category, and tool matchers to target specific search terms.'
            : 'Set default metadata, verification tags, split sitemaps, robots.txt, structured data, and IndexNow instant indexing.'
        }
      />

      {settings && updateSettings && mode !== 'pages' && (
        <Panel>
          <PanelHeader
            title="Global SEO"
            subtitle="Default metadata, verification tags, split sitemap rules, robots text, structured data, and IndexNow"
          />

          <div className="space-y-4">
            <SectionEyebrow>1. Default metadata</SectionEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Home SEO title template"
                action={
                  <WandButton
                    fieldId="seo-global-home-template"
                    value={seoSettings.homeSeoTitleTemplate || ''}
                    onChange={(v) => updateSeoSettings({ homeSeoTitleTemplate: v })}
                    prompt={seoPrompts.globalTitleTemplate}
                  />
                }
              >
                <textarea rows={2}
                  value={seoSettings.homeSeoTitleTemplate || ''}
                  onChange={e => updateSeoSettings({ homeSeoTitleTemplate: e.target.value })}
                  className={`${adminInput} resize-y`}
                  placeholder="%site_title% - AI Prompts"
                />
                <CharCount value={seoSettings.homeSeoTitleTemplate || ''} recommended={60} />
              </Field>
              <Field
                label="Default meta title template"
                action={
                  <WandButton
                    fieldId="seo-global-title-template"
                    value={seoSettings.metaTitleTemplate || ''}
                    onChange={(v) => updateSeoSettings({ metaTitleTemplate: v })}
                    prompt={seoPrompts.globalTitleTemplate}
                  />
                }
              >
                <textarea rows={2}
                  value={seoSettings.metaTitleTemplate || ''}
                  onChange={e => updateSeoSettings({ metaTitleTemplate: e.target.value })}
                  className={`${adminInput} resize-y`}
                  placeholder="%post_title%"
                />
                <CharCount value={seoSettings.metaTitleTemplate || ''} recommended={60} />
              </Field>
              <Field label="Twitter handle">
                <input
                  value={seoSettings.twitterHandle || ''}
                  onChange={e => updateSeoSettings({ twitterHandle: e.target.value })}
                  className={adminInput}
                  placeholder="@username"
                />
              </Field>
              <Field
                label="Default meta description"
                className="md:col-span-2"
                action={
                  <WandButton
                    fieldId="seo-global-meta-desc"
                    value={seoSettings.defaultMetaDescription || ''}
                    onChange={(v) => updateSeoSettings({ defaultMetaDescription: v })}
                    prompt={seoPrompts.globalMetaDescription}
                  />
                }
              >
                <textarea
                  value={seoSettings.defaultMetaDescription || ''}
                  onChange={e => updateSeoSettings({ defaultMetaDescription: e.target.value })}
                  rows={2}
                  className={`${adminInput} resize-y`}
                />
                <CharCount value={seoSettings.defaultMetaDescription || ''} recommended={160} />
              </Field>
              <Field label="Default OG image" className="md:col-span-2">
                <input
                  value={seoSettings.defaultOgImage || ''}
                  onChange={e => updateSeoSettings({ defaultOgImage: e.target.value })}
                  className={adminInput}
                  placeholder="https://..."
                />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>2. Site verification</SectionEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ['googleVerification', 'Google Search Console'],
                ['bingVerification', 'Bing Webmaster'],
                ['pinterestVerification', 'Pinterest domain verify'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={(seoSettings as any)[key] || ''}
                    onChange={e => updateSeoSettings({ [key]: e.target.value } as Partial<SeoSettings>)}
                    className={adminInput}
                    placeholder="Verification token"
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>3. Sitemap (Split Structure)</SectionEyebrow>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.03]">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-surface-800 dark:text-surface-200">
                    Live XML Sitemaps:
                  </p>
                  <p className="text-[11px] text-surface-500 font-mono">
                    /sitemap.xml (Index) &bull; /sitemap-main.xml (Pages) &bull; /sitemap-prompts.xml (Prompts)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => window.open('/sitemap.xml', '_blank')} className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 border border-black/5 dark:border-white/10 transition-colors">Open Index</button>
                  <button type="button" onClick={() => window.open('/sitemap-main.xml', '_blank')} className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 border border-black/5 dark:border-white/10 transition-colors">Main Sitemap</button>
                  <button type="button" onClick={() => window.open('/sitemap-prompts.xml', '_blank')} className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 border border-black/5 dark:border-white/10 transition-colors">Prompts Sitemap</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ['posts', 'Posts'],
                  ['sections', 'Sections'],
                  ['tags', 'Tags'],
                  ['tools', 'Tool pages'],
                  ['staticPages', 'Static pages'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300">
                    <span>{label}</span>
                    <Toggle
                      checked={Boolean((seoSettings.sitemapInclude as any)?.[key] ?? true)}
                      onChange={checked => updateSeoSettings({ sitemapInclude: { [key]: checked } as any })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>4. Crawling</SectionEyebrow>
            <Field
              label="Robots.txt"
              action={
                <div className="flex items-center gap-2">
                  {!seoSettings.robotsText?.includes('sitemap-prompts.xml') && (
                    <button
                      type="button"
                      onClick={() => {
                        const current = (seoSettings.robotsText || '').trim();
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://promptsoul.in';
                        const addition = `\nSitemap: ${baseUrl}/sitemap-prompts.xml`;
                        updateSeoSettings({
                          robotsText: current ? `${current}${addition}` : `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\nDisallow: /api/\nDisallow: /search/\nDisallow: /submit/\nDisallow: /login/\n\nSitemap: ${baseUrl}/sitemap.xml\nSitemap: ${baseUrl}/sitemap-prompts.xml`,
                        });
                      }}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      + Add Prompts Sitemap
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://promptsoul.in';
                      updateSeoSettings({
                        robotsText: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\nDisallow: /api/\nDisallow: /search/\nDisallow: /submit/\nDisallow: /login/\n\nSitemap: ${baseUrl}/sitemap.xml\nSitemap: ${baseUrl}/sitemap-prompts.xml`,
                      });
                    }}
                    className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                  >
                    Reset to recommended
                  </button>
                </div>
              }
            >
              <textarea
                value={seoSettings.robotsText || ''}
                onChange={e => updateSeoSettings({ robotsText: e.target.value })}
                rows={8}
                className={`${adminInput} font-mono resize-y`}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>5. Structured data</SectionEyebrow>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex min-h-10 items-center justify-between gap-3 px-1 py-2 text-xs font-bold text-surface-700 dark:text-surface-300">
                <span>JSON-LD on post pages</span>
                <Toggle checked={seoSettings.enableJsonLd ?? true} onChange={checked => updateSeoSettings({ enableJsonLd: checked })} />
              </div>
              <div className="flex min-h-10 items-center justify-between gap-3 px-1 py-2 text-xs font-bold text-surface-700 dark:text-surface-300">
                <span>BreadcrumbList</span>
                <Toggle checked={seoSettings.enableBreadcrumbList ?? true} onChange={checked => updateSeoSettings({ enableBreadcrumbList: checked })} />
              </div>
              <Field label="Schema type">
                <AdminSelect
                  value={seoSettings.schemaType || 'Article'}
                  onChange={v => updateSeoSettings({ schemaType: v as SeoSettings['schemaType'] })}
                  className={adminInput}
                >
                  <option value="Article">Article</option>
                  <option value="CreativeWork">CreativeWork</option>
                  <option value="HowTo">HowTo</option>
                </AdminSelect>
              </Field>
              <Field label="Google Search Alternate Site Names" className="md:col-span-2">
                <input
                  value={(seoSettings.alternateSiteNames || []).join(', ')}
                  onChange={e => updateSeoSettings({
                    alternateSiteNames: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className={adminInput}
                  placeholder="PromptSoul, Prompt Soul, PromptSoul AI"
                />
                <p className="mt-1 text-[11px] text-surface-500 dark:text-surface-400">
                  Comma-separated alias/fallback names for Google Search. Google displays your preferred site name above search result snippet URLs based on these.
                </p>
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>6. IndexNow (Instant Search Indexing)</SectionEyebrow>
            <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/40 dark:bg-white/[0.04] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-surface-900 dark:text-white">Microsoft Bing & IndexNow Auto-Ping</p>
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    Instantly notifies Bing, Yandex, Naver, and Seznam whenever prompts or pages are published or updated.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={seoSettings.enableIndexNow ?? true}
                    onChange={checked => updateSeoSettings({ enableIndexNow: checked })}
                  />
                  <span className="text-xs font-bold text-surface-700 dark:text-surface-300">
                    {seoSettings.enableIndexNow ?? true ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                <Field label="IndexNow API Key">
                  <input
                    value={seoSettings.indexNowKey || 'd2725a72cddd4faba71fcc50a0d414cc'}
                    onChange={e => updateSeoSettings({ indexNowKey: e.target.value.trim() })}
                    className={adminInput}
                    placeholder="d2725a72cddd4faba71fcc50a0d414cc"
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(`/${seoSettings.indexNowKey || 'd2725a72cddd4faba71fcc50a0d414cc'}.txt`, '_blank')}
                    className="rounded-xl px-3 py-2 text-xs font-bold border border-black/10 dark:border-white/10 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                  >
                    Verify Key File
                  </button>
                  <button
                    type="button"
                    disabled={isPingingIndexNow}
                    onClick={handlePingIndexNow}
                    className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isPingingIndexNow ? 'Submitting...' : 'Ping IndexNow (Recent Prompts)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>7. Redirects</SectionEyebrow>
            <div className="space-y-3">
              <div className="space-y-2">
                {(seoSettings.redirects || []).map((redirect, index) => (
                  <div key={`${redirect.from}-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_auto]">
                    <input value={redirect.from} onChange={e => {
                      const redirects = [...(seoSettings.redirects || [])];
                      redirects[index] = { ...redirect, from: e.target.value };
                      updateSeoSettings({ redirects });
                    }} className={adminInput} placeholder="/old-path" />
                    <input value={redirect.to} onChange={e => {
                      const redirects = [...(seoSettings.redirects || [])];
                      redirects[index] = { ...redirect, to: e.target.value };
                      updateSeoSettings({ redirects });
                    }} className={adminInput} placeholder="/new-path" />
                    <AdminSelect value={redirect.status} onChange={v => {
                      const redirects = [...(seoSettings.redirects || [])];
                      redirects[index] = { ...redirect, status: Number(v) as 301 | 302 };
                      updateSeoSettings({ redirects });
                    }} className={adminInput}>
                      <option value={301}>301</option>
                      <option value={302}>302</option>
                    </AdminSelect>
                    <button type="button" onClick={() => updateSeoSettings({ redirects: (seoSettings.redirects || []).filter((_, itemIndex) => itemIndex !== index) })} className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => updateSeoSettings({ redirects: [...(seoSettings.redirects || []), { from: '', to: '', status: 301 }] })} className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"><Plus className="w-3.5 h-3.5" /> Add redirect</button>
            </div>
          </div>
        </Panel>
      )}

      {mode !== 'global' && (
      <Panel>
        <PanelHeader
          title="SEO pages"
          count={seoPages.length}
          subtitle="Curated landing pages built from tag, category, and tool matchers"
          actions={
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors">
              <Plus className="w-4 h-4" /> New SEO page
            </button>
          }
        />
        <div className="space-y-3">
          {loadingPages && (
            <div className="py-8 text-center text-xs text-surface-400">Loading SEO pages...</div>
          )}
          {!loadingPages && seoPages.length === 0 && <p className="text-surface-500 text-xs">No SEO pages created. These help you rank for specific term combinations.</p>}
          {!loadingPages && seoPages.map(page => (
            <EditableCard key={page.id} isEditing={false}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-surface-900 dark:text-white">{page.heroTitle || page.title}</h3>
                    {page.heroBadge && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300">
                        {page.heroBadge}
                      </span>
                    )}
                  </div>
                  {(page.heroDescription || page.seoDescription) && (
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{page.heroDescription || page.seoDescription}</p>
                  )}
                  <p className="text-xs font-mono text-primary-500 break-all mb-1">/{page.slug}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-surface-500">
                    {page.tags?.length > 0 && <span>Tags: {page.tags.join(', ')}</span>}
                    {page.categories?.length > 0 && <span>Cats: {page.categories.join(', ')}</span>}
                    {page.aiTools?.length > 0 && <span>Tools: {page.aiTools.join(', ')}</span>}
                    {page.filterTags?.length > 0 && <span>Filter rail: {page.filterTags.join(', ')}</span>}
                    {page.cardStyle && <span>Cards: {page.cardStyle}</span>}
                    {page.heroStyle && <span className="font-semibold text-primary-600 dark:text-primary-400">Hero: {page.heroStyle === 'simple' ? 'Simple' : 'Container'}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button title="View page" onClick={() => window.open(`/${page.slug}`,'_blank')} className="p-2 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-xl text-primary-500 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </button>
                  <button title="Edit page" onClick={() => startEdit(page)} className="p-2 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-xl text-primary-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button title="Delete page" onClick={() => handleDelete(page.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </EditableCard>
          ))}
        </div>
      </Panel>
      )}
    </div>
  );
}
