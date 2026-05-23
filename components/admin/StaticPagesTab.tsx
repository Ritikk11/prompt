'use client';
import { useState } from 'react';
import type { SiteSettings } from '@/lib/types';
import { Save } from 'lucide-react';

export default function StaticPagesTab({ settings, updateSettings }: { settings: SiteSettings, updateSettings: (s: SiteSettings) => void }) {
  const [pageAbout, setPageAbout] = useState(settings.pageAbout || '');
  const [pagePrivacy, setPagePrivacy] = useState(settings.pagePrivacy || '');
  const [pageTerms, setPageTerms] = useState(settings.pageTerms || '');
  const [pageDmca, setPageDmca] = useState(settings.pageDmca || '');
  const [pageDisclaimer, setPageDisclaimer] = useState(settings.pageDisclaimer || '');
  const [pageContact, setPageContact] = useState(settings.pageContact || '');

  const [activeTab, setActiveTab] = useState<'about' | 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'contact'>('about');

  const handleSave = () => {
    updateSettings({
      ...settings,
      pageAbout,
      pagePrivacy,
      pageTerms,
      pageDmca,
      pageDisclaimer,
      pageContact
    });
    alert('Static pages updated effectively.');
  };

  const textareas = {
    about: { label: 'About Us', value: pageAbout, set: setPageAbout },
    privacy: { label: 'Privacy Policy', value: pagePrivacy, set: setPagePrivacy },
    terms: { label: 'Terms of Service', value: pageTerms, set: setPageTerms },
    dmca: { label: 'DMCA', value: pageDmca, set: setPageDmca },
    disclaimer: { label: 'Disclaimer', value: pageDisclaimer, set: setPageDisclaimer },
    contact: { label: 'Contact Us', value: pageContact, set: setPageContact }
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

      <div>
        <label className="block text-sm font-medium mb-2">{textareas[activeTab].label} (Markdown Format)</label>
        <textarea
          value={textareas[activeTab].value}
          onChange={e => textareas[activeTab].set(e.target.value)}
          rows={20}
          className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 font-mono text-sm resize-y"
          placeholder={`# ${textareas[activeTab].label}\n\nEnter content here...`}
        />
      </div>
    </div>
  );
}
