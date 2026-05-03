'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit3, X, Save } from 'lucide-react';

export default function SeoPagesTab() {
  const [seoPages, setSeoPages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [categoriesStr, setCategoriesStr] = useState('');
  const [aiToolsStr, setAiToolsStr] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'seoPages'), (snap) => {
      const pages: any[] = [];
      snap.forEach(d => {
        pages.push({ id: d.id, ...d.data() });
      });
      setSeoPages(pages);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setTitle(''); setSlug(''); setTagsStr(''); setCategoriesStr(''); setAiToolsStr('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (page: any) => {
    setTitle(page.title);
    setSlug(page.slug);
    setTagsStr((page.tags || []).join(', '));
    setCategoriesStr((page.categories || []).join(', '));
    setAiToolsStr((page.aiTools || []).join(', '));
    setEditingId(page.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title || !slug) return alert('Title and slug required');
    const id = editingId || Math.random().toString(36).substr(2, 9);
    
    const data = {
      id,
      title,
      slug,
      tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
      categories: categoriesStr.split(',').map(s => s.trim()).filter(Boolean),
      aiTools: aiToolsStr.split(',').map(s => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'seoPages', id), data);
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Error saving SEO page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SEO page?')) return;
    try {
      await deleteDoc(doc(db, 'seoPages', id));
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
            <label className="block text-sm font-medium mb-1.5">Title (Used for generateMetadata & heading)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. Best Upscale Images generated with Gemini" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Slug (/page/[slug])</label>
             <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. upscale-images-gemini" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Required Tags (comma separated)</label>
             <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. upscale, boys" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Required Categories (comma separated)</label>
             <input value={categoriesStr} onChange={e => setCategoriesStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. image" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1.5">Required AI Tools (comma separated)</label>
             <input value={aiToolsStr} onChange={e => setAiToolsStr(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 outline-none text-sm" placeholder="e.g. gemini, dall-e" />
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
              <p className="text-xs text-primary-500 break-all mb-1">/page/{page.slug}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-surface-500">
                {page.tags?.length > 0 && <span>Tags: {page.tags.join(', ')}</span>}
                {page.categories?.length > 0 && <span>Cats: {page.categories.join(', ')}</span>}
                {page.aiTools?.length > 0 && <span>Tools: {page.aiTools.join(', ')}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button title="View Details" onClick={() => window.open(`/page/${page.slug}`,'_blank')} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-primary-500">
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
