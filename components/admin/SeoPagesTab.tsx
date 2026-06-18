'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import type { SeoSettings, SiteSettings } from '@/lib/types';

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
  metaTitleTemplate: '%post_title% | AI PromptMatrix',
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
  enableSitelinksSearchbox: true,
  redirects: [],
};

export default function SeoPagesTab({ settings, updateSettings }: { settings?: SiteSettings; updateSettings?: (s: SiteSettings) => void }) {
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
      <div className="max-w-2xl bg-white dark:bg-surface-900 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{editingId ? 'Edit SEO Page' : 'Create SEO Page'}</h2>
          <button onClick={resetForm} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Page Heading</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. Best Upscale Images generated with Gemini" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">SEO Title (optional)</label>
            <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="Defaults to page heading" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Meta Description (optional)</label>
            <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm resize-y" placeholder="Short search-result description for this page..." />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Slug (available as /slug and /page/slug)</label>
             <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. upscale-images-gemini" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Intro Content (optional)</label>
             <textarea value={introContent} onChange={e => setIntroContent(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm resize-y" placeholder="Short intro shown above the matching prompt grid. Markdown is supported." />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Required Tags (comma separated, all must match)</label>
             <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. upscale, boys" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Required Categories (comma separated, all must match)</label>
             <input value={categoriesStr} onChange={e => setCategoriesStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. image" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Required AI Tools (comma separated, all must match)</label>
             <input value={aiToolsStr} onChange={e => setAiToolsStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. gemini, dall-e" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Filter Rail Tags (optional)</label>
             <input value={filterTagsStr} onChange={e => setFilterTagsStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. character, anime, realistic" />
             <p className="mt-1 text-xs text-surface-500">Shows a horizontal tag selector above this page grid. Tags must match post tags.</p>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Card Style (optional)</label>
             <select value={cardStyle} onChange={e => setCardStyle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm">
               <option value="">Use global card style</option>
               {['v1','v2','v3','v4','v5','v6','v7','v8'].map(style => (
                 <option key={style} value={style}>{style}</option>
               ))}
             </select>
             <p className="mt-1 text-xs text-surface-500">Use this when you want this page to show a different card design than the rest of the site.</p>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors">
            <Save className="w-4 h-4" /> Save SEO Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {settings && updateSettings && (
        <div className="mb-8 space-y-5 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <div>
            <h2 className="text-xl font-bold">Global SEO</h2>
            <p className="mt-1 text-sm text-surface-500">Default metadata, verification tags, sitemap rules, robots text, structured data, and redirects.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Default meta title template</label>
              <input
                value={seoSettings.metaTitleTemplate || ''}
                onChange={e => updateSeoSettings({ metaTitleTemplate: e.target.value })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                placeholder="%post_title% | AI PromptMatrix"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Twitter handle</label>
              <input
                value={seoSettings.twitterHandle || ''}
                onChange={e => updateSeoSettings({ twitterHandle: e.target.value })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                placeholder="@username"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-surface-500 mb-1">Default meta description</label>
              <textarea
                value={seoSettings.defaultMetaDescription || ''}
                onChange={e => updateSeoSettings({ defaultMetaDescription: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-surface-500 mb-1">Default OG image</label>
              <input
                value={seoSettings.defaultOgImage || ''}
                onChange={e => updateSeoSettings({ defaultOgImage: e.target.value })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['googleVerification', 'Google Search Console'],
              ['bingVerification', 'Bing Webmaster'],
              ['pinterestVerification', 'Pinterest domain verify'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-surface-500 mb-1">{label}</label>
                <input
                  value={(seoSettings as any)[key] || ''}
                  onChange={e => updateSeoSettings({ [key]: e.target.value } as Partial<SeoSettings>)}
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                  placeholder="verification token"
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-800/50">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Sitemap</p>
                <p className="text-xs text-surface-500">Readonly URL: aipromptmatrix.in/sitemap.xml</p>
              </div>
              <button type="button" onClick={() => window.open('/sitemap.xml', '_blank')} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary-600 dark:bg-surface-900">Open Sitemap</button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ['posts', 'Posts'],
                ['sections', 'Sections'],
                ['tags', 'Tags'],
                ['tools', 'Tool pages'],
                ['staticPages', 'Static pages'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean((seoSettings.sitemapInclude as any)?.[key] ?? true)}
                    onChange={e => updateSeoSettings({ sitemapInclude: { [key]: e.target.checked } as any })}
                    className="h-4 w-4 rounded text-primary-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Robots.txt</label>
            <textarea
              value={seoSettings.robotsText || ''}
              onChange={e => updateSeoSettings({ robotsText: e.target.value })}
              rows={6}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 font-mono text-xs outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={seoSettings.enableJsonLd ?? true} onChange={e => updateSeoSettings({ enableJsonLd: e.target.checked })} className="h-4 w-4 rounded text-primary-500" />
              Enable JSON-LD on post pages
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={seoSettings.enableBreadcrumbList ?? true} onChange={e => updateSeoSettings({ enableBreadcrumbList: e.target.checked })} className="h-4 w-4 rounded text-primary-500" />
              Enable BreadcrumbList
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={seoSettings.enableSitelinksSearchbox ?? true} onChange={e => updateSeoSettings({ enableSitelinksSearchbox: e.target.checked })} className="h-4 w-4 rounded text-primary-500" />
              Enable WebSite sitelinks searchbox
            </label>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Schema type</label>
              <select
                value={seoSettings.schemaType || 'HowTo'}
                onChange={e => updateSeoSettings({ schemaType: e.target.value as SeoSettings['schemaType'] })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
              >
                <option value="Article">Article</option>
                <option value="CreativeWork">CreativeWork</option>
                <option value="HowTo">HowTo</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-800/50">
            <p className="mb-3 text-sm font-bold">Redirects</p>
            <div className="space-y-2">
              {(seoSettings.redirects || []).map((redirect, index) => (
                <div key={`${redirect.from}-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_90px_auto]">
                  <input value={redirect.from} onChange={e => {
                    const redirects = [...(seoSettings.redirects || [])];
                    redirects[index] = { ...redirect, from: e.target.value };
                    updateSeoSettings({ redirects });
                  }} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900" placeholder="/old-path" />
                  <input value={redirect.to} onChange={e => {
                    const redirects = [...(seoSettings.redirects || [])];
                    redirects[index] = { ...redirect, to: e.target.value };
                    updateSeoSettings({ redirects });
                  }} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900" placeholder="/new-path" />
                  <select value={redirect.status} onChange={e => {
                    const redirects = [...(seoSettings.redirects || [])];
                    redirects[index] = { ...redirect, status: Number(e.target.value) as 301 | 302 };
                    updateSeoSettings({ redirects });
                  }} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900">
                    <option value={301}>301</option>
                    <option value={302}>302</option>
                  </select>
                  <button type="button" onClick={() => updateSeoSettings({ redirects: (seoSettings.redirects || []).filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg px-3 py-2 text-sm font-bold text-red-500">Remove</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => updateSeoSettings({ redirects: [...(seoSettings.redirects || []), { from: '', to: '', status: 301 }] })} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary-600 dark:bg-surface-900">+ Add redirect</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">SEO Pages</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" /> New SEO Page
        </button>
      </div>
      <div className="space-y-3 max-w-3xl">
        {seoPages.length === 0 && <p className="text-surface-500 text-sm">No SEO pages created. These help you rank for specific term combinations.</p>}
        {seoPages.map(page => (
          <div key={page.id} className="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div>
              <h3 className="font-semibold text-sm">{page.title}</h3>
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
            <div className="flex gap-2">
              <button title="View Details" onClick={() => window.open(`/${page.slug}`,'_blank')} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-primary-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </button>
              <button onClick={() => startEdit(page)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-primary-500"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(page.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
