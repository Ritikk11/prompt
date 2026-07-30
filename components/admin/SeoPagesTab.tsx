'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import type { SeoSettings, SiteSettings } from '@/lib/types';
import { WandButton } from '@/components/admin/MagicWand';
import { seoPrompts } from '@/lib/admin/wandPrompts';
import { TabBanner, Panel, PanelHeader, SectionEyebrow, Field, EditableCard, adminInput } from '@/components/admin/AdminUI';

type SeoPagesTabMode = 'global' | 'pages' | 'all';

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-xs font-bold">
      <span className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-700'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
      {label && <span className={checked ? 'text-primary-600 dark:text-primary-300' : 'text-surface-500'}>{label}</span>}
    </button>
  );
}

async function adminRequest(payload?: any) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (payload) headers['Content-Type'] = 'application/json';
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch('/api/admin', {
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
  robotsText: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\n\nSitemap: https://aipromptmatrix.in/sitemap.xml',
  sitemapInclude: { posts: true, sections: true, tags: true, tools: true, staticPages: true },
  enableJsonLd: true,
  schemaType: 'HowTo',
  enableBreadcrumbList: true,
  redirects: [],
};

export default function SeoPagesTab({ settings, updateSettings, mode = 'all' }: { settings?: SiteSettings; updateSettings?: (s: SiteSettings) => void; mode?: SeoPagesTabMode }) {
  const [seoPages, setSeoPages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [introContent, setIntroContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [categoriesStr, setCategoriesStr] = useState('');
  const [aiToolsStr, setAiToolsStr] = useState('');
  const [filterTagsStr, setFilterTagsStr] = useState('');
  const [cardStyle, setCardStyle] = useState('');
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

  useEffect(() => {
    const fetchPages = async () => {
      const data = await adminRequest();
      setSeoPages(data.seopages || []);
    };

    fetchPages().catch((error) => console.error('SEO pages fetch error:', error));
  }, []);

  const resetForm = () => {
    setTitle(''); setSeoTitle(''); setSeoDescription(''); setSlug(''); setIntroContent(''); setTagsStr(''); setCategoriesStr(''); setAiToolsStr(''); setFilterTagsStr(''); setCardStyle('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (page: any) => {
    setTitle(page.title);
    setSeoTitle(page.seoTitle || '');
    setSeoDescription(page.seoDescription || '');
    setSlug(page.slug);
    setIntroContent(page.introContent || '');
    setTagsStr((page.tags || []).join(', '));
    setCategoriesStr((page.categories || []).join(', '));
    setAiToolsStr((page.aiTools || []).join(', '));
    setFilterTagsStr((page.filterTags || []).join(', '));
    setCardStyle(page.cardStyle || '');
    setEditingId(page.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title || !slug) return alert('Title and slug required');
    const id = editingId || Math.random().toString(36).substr(2, 9);
    
    const data = {
      id,
      title,
      seoTitle,
      seoDescription,
      slug,
      introContent,
      tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
      categories: categoriesStr.split(',').map(s => s.trim()).filter(Boolean),
      aiTools: aiToolsStr.split(',').map(s => s.trim()).filter(Boolean),
      filterTags: filterTagsStr.split(',').map(s => s.trim()).filter(Boolean),
      cardStyle: cardStyle || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await adminRequest({ action: 'upsert', resource: 'seopages', id, data });
      const adminData = await adminRequest();
      setSeoPages(adminData.seopages || []);
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Error saving SEO page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SEO page?')) return;
    try {
      await adminRequest({ action: 'delete', resource: 'seopages', id });
      setSeoPages(prev => prev.filter(page => page.id !== id));
    } catch (e) {
      console.error(e);
      alert('Error deleting');
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
            <SectionEyebrow>1. Page content</SectionEyebrow>
            <Field
              label="Page heading"
              action={
                <WandButton
                  fieldId="seo-page-heading"
                  value={title}
                  onChange={setTitle}
                  prompt={() => seoPrompts.pageHeading(slug, tagsStr)}
                />
              }
            >
              <input value={title} onChange={e => setTitle(e.target.value)} className={adminInput} placeholder="e.g. Best Upscale Images generated with Gemini" />
            </Field>
            <Field label="Slug (available as /slug and /page/slug)">
              <input value={slug} onChange={e => setSlug(e.target.value)} className={adminInput} placeholder="e.g. upscale-images-gemini" />
            </Field>
            <Field
              label="Intro content (optional)"
              action={
                <WandButton
                  fieldId="seo-page-intro"
                  value={introContent}
                  onChange={setIntroContent}
                  prompt={() => seoPrompts.pageIntroContent(slug || title, tagsStr)}
                />
              }
            >
              <textarea value={introContent} onChange={e => setIntroContent(e.target.value)} rows={4} className={`${adminInput} resize-y`} placeholder="Short intro shown above the matching prompt grid. Markdown is supported." />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>2. Search appearance</SectionEyebrow>
            <Field
              label="SEO title (optional)"
              action={
                <WandButton
                  fieldId="seo-page-seo-title"
                  value={seoTitle}
                  onChange={setSeoTitle}
                  prompt={() => seoPrompts.pageSeoTitle(slug || title, tagsStr)}
                />
              }
            >
              <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className={adminInput} placeholder="Defaults to page heading" />
            </Field>
            <Field
              label="Meta description (optional)"
              action={
                <WandButton
                  fieldId="seo-page-meta-desc"
                  value={seoDescription}
                  onChange={setSeoDescription}
                  prompt={() => seoPrompts.pageMetaDescription(slug || title, tagsStr)}
                />
              }
            >
              <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} className={`${adminInput} resize-y`} placeholder="Short search-result description for this page..." />
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
              <select value={cardStyle} onChange={e => setCardStyle(e.target.value)} className={adminInput}>
                <option value="">Use global card style</option>
                {['v1','v2','v3','v4','v5','v6','v7','v8'].map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-surface-500">Use this when you want this page to show a different card design than the rest of the site.</p>
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
        title="SEO"
        text="Set default metadata for every page and build curated landing pages that rank for specific term combinations."
      />

      {settings && updateSettings && mode !== 'pages' && (
        <Panel>
          <PanelHeader
            title="Global SEO"
            subtitle="Default metadata, verification tags, sitemap rules, robots text, structured data, and redirects"
          />

          <div className="space-y-4">
            <SectionEyebrow>1. Default metadata</SectionEyebrow>
            <div className="grid gap-4 md:grid-cols-2">
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
                <input
                  value={seoSettings.homeSeoTitleTemplate || ''}
                  onChange={e => updateSeoSettings({ homeSeoTitleTemplate: e.target.value })}
                  className={adminInput}
                  placeholder="%site_title% - AI Prompts"
                />
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
                <input
                  value={seoSettings.metaTitleTemplate || ''}
                  onChange={e => updateSeoSettings({ metaTitleTemplate: e.target.value })}
                  className={adminInput}
                  placeholder="%post_title%"
                />
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
            <div className="grid gap-4 md:grid-cols-3">
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
            <SectionEyebrow>3. Sitemap</SectionEyebrow>
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-surface-500">Readonly URL: aipromptmatrix.in/sitemap.xml</p>
                <button type="button" onClick={() => window.open('/sitemap.xml', '_blank')} className="rounded-xl px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">Open sitemap</button>
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
                    <ToggleSwitch
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
            <Field label="Robots.txt">
              <textarea
                value={seoSettings.robotsText || ''}
                onChange={e => updateSeoSettings({ robotsText: e.target.value })}
                rows={6}
                className={`${adminInput} font-mono resize-y`}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>5. Structured data</SectionEyebrow>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 p-3 text-xs font-bold text-surface-700 dark:text-surface-300">
                <span>JSON-LD on post pages</span>
                <ToggleSwitch checked={seoSettings.enableJsonLd ?? true} onChange={checked => updateSeoSettings({ enableJsonLd: checked })} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 p-3 text-xs font-bold text-surface-700 dark:text-surface-300">
                <span>BreadcrumbList</span>
                <ToggleSwitch checked={seoSettings.enableBreadcrumbList ?? true} onChange={checked => updateSeoSettings({ enableBreadcrumbList: checked })} />
              </div>
              <Field label="Schema type">
                <select
                  value={seoSettings.schemaType || 'HowTo'}
                  onChange={e => updateSeoSettings({ schemaType: e.target.value as SeoSettings['schemaType'] })}
                  className={adminInput}
                >
                  <option value="Article">Article</option>
                  <option value="CreativeWork">CreativeWork</option>
                  <option value="HowTo">HowTo</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <SectionEyebrow>6. Redirects</SectionEyebrow>
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 p-4">
              <div className="space-y-2">
                {(seoSettings.redirects || []).map((redirect, index) => (
                  <div key={`${redirect.from}-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_90px_auto]">
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
                    <select value={redirect.status} onChange={e => {
                      const redirects = [...(seoSettings.redirects || [])];
                      redirects[index] = { ...redirect, status: Number(e.target.value) as 301 | 302 };
                      updateSeoSettings({ redirects });
                    }} className={adminInput}>
                      <option value={301}>301</option>
                      <option value={302}>302</option>
                    </select>
                    <button type="button" onClick={() => updateSeoSettings({ redirects: (seoSettings.redirects || []).filter((_, itemIndex) => itemIndex !== index) })} className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => updateSeoSettings({ redirects: [...(seoSettings.redirects || []), { from: '', to: '', status: 301 }] })} className="mt-3 flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"><Plus className="w-3.5 h-3.5" /> Add redirect</button>
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
          {seoPages.length === 0 && <p className="text-surface-500 text-xs">No SEO pages created. These help you rank for specific term combinations.</p>}
          {seoPages.map(page => (
            <EditableCard key={page.id} isEditing={false}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-surface-900 dark:text-white">{page.title}</h3>
                  {page.seoDescription && <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{page.seoDescription}</p>}
                  <p className="text-xs text-primary-500 break-all mb-1">/{page.slug} <span className="text-surface-500">or</span> /page/{page.slug}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-surface-500">
                    {page.tags?.length > 0 && <span>Tags: {page.tags.join(', ')}</span>}
                    {page.categories?.length > 0 && <span>Cats: {page.categories.join(', ')}</span>}
                    {page.aiTools?.length > 0 && <span>Tools: {page.aiTools.join(', ')}</span>}
                    {page.filterTags?.length > 0 && <span>Filter rail: {page.filterTags.join(', ')}</span>}
                    {page.cardStyle && <span>Cards: {page.cardStyle}</span>}
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
