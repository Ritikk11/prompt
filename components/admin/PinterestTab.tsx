'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Share2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink,
  UploadCloud, Sparkles, Image as ImageIcon, ShieldCheck,
  Send, Layers, Check, Clock
} from 'lucide-react';
import { TabBanner, Panel, PanelHeader, Field, Toggle, ActionButton, adminInput } from './AdminUI';
import { showToast } from '@/components/ui/ToastContainer';
import { createClient } from '@/lib/supabase-client';
import type { SiteSettings, PinterestSettings, Post } from '@/lib/types';
import {
  DEFAULT_PINTEREST_APP_ID,
  DEFAULT_PINTEREST_BOARD_ID,
  DEFAULT_PINTEREST_BOARD_NAME,
} from '@/lib/pinterest';

interface PinterestTabProps {
  settings: SiteSettings;
  updateSettings: (settings: SiteSettings) => Promise<void> | void;
  posts: Post[];
  onRefreshData?: () => void;
}

interface PinterestStatusData {
  connected: boolean;
  username: string;
  appId: string;
  boardId: string;
  boardName: string;
  autoPublishNewPosts: boolean;
  lastPublishedAt: string | null;
  authUrl: string;
  boards: Array<{ id: string; name: string; privacy?: string }>;
  stats: {
    totalPublished: number;
    pinnedCount: number;
    unpinnedCount: number;
  };
  connectionError?: string | null;
}

export default function PinterestTab({
  settings,
  updateSettings,
  posts,
  onRefreshData,
}: PinterestTabProps) {
  const [status, setStatus] = useState<PinterestStatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ total: number; done: number } | null>(null);

  const currentPinterest = settings.pinterestSettings || {};

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return {
          Authorization: `Bearer ${session.access_token}`,
        };
      }
    } catch (e) {
      console.error('Failed to get auth token for Pinterest request:', e);
    }
    return {};
  };

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/pinterest/status', {
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load Pinterest status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStatus]);

  // Check URL params for oauth feedback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('pinterest') === 'connected') {
      showToast('Pinterest connected successfully! Board verified.', 'success');
      window.setTimeout(() => {
        void fetchStatus();
      }, 0);
      onRefreshData?.();
    } else if (params.get('pinterest_error')) {
      showToast(`Pinterest connection failed: ${params.get('pinterest_error')}`, 'error');
    }
  }, [fetchStatus, onRefreshData]);

  const handleConnect = () => {
    if (status?.authUrl) {
      window.location.href = status.authUrl;
    }
  };

  const handleUpdateConfig = (field: keyof PinterestSettings, value: any) => {
    updateSettings({
      ...settings,
      pinterestSettings: {
        ...settings.pinterestSettings,
        [field]: value,
      },
    });
  };

  const handlePublishSingle = async (postId: string) => {
    try {
      setPublishingId(postId);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/pinterest/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Publish failed');
      }

      showToast('Pin created on Pinterest successfully!', 'success');
      fetchStatus();
      onRefreshData?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish to Pinterest', 'error');
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishAll = async () => {
    if (!confirm('Publish all unpinned prompts to your Pinterest board now?')) return;

    try {
      setBulkPublishing(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/pinterest/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ all: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk publish failed');
      }

      const summary = data.summary;
      showToast(
        `Bulk publish complete: ${summary.successfulCount} of ${summary.totalEligible} pins published!`,
        'success'
      );
      fetchStatus();
      onRefreshData?.();
    } catch (err: any) {
      showToast(err.message || 'Failed bulk publishing to Pinterest', 'error');
    } finally {
      setBulkPublishing(false);
    }
  };

  const isConnected = status?.connected ?? currentPinterest.isConnected;
  const username = status?.username || currentPinterest.username || 'aipromptmatrix';
  const boardName = status?.boardName || currentPinterest.boardName || DEFAULT_PINTEREST_BOARD_NAME;
  const boardId = status?.boardId || currentPinterest.boardId || DEFAULT_PINTEREST_BOARD_ID;

  const publishedPosts = posts.filter(p => p.status === 'published');
  const pinnedCount = publishedPosts.filter(p => !!p.pinterestPinId).length;
  const unpinnedCount = publishedPosts.length - pinnedCount;

  return (
    <div className="space-y-6">
      <TabBanner
        icon={<Share2 className="w-5 h-5 text-rose-500" />}
        title="Pinterest Auto-Publishing (Official API v5)"
        text="Automatically publish your high-resolution AI prompts, descriptions, and canonical backlinks directly to your official Pinterest board."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 text-xs font-semibold hover:bg-white transition-all shadow-sm"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" />
              {isConnected ? 'Reconnect Pinterest' : 'Connect Pinterest Account'}
            </button>
          </div>
        }
      />

      {/* Account Connection Status Panel */}
      <Panel>
        <PanelHeader
          title="Account & Board Connection"
          subtitle="Official Pinterest API v5 integration details"
          actions={
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected (@{username})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Not Connected
                </span>
              )}
            </div>
          }
        />

        {status?.connectionError && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{status.connectionError} — click &quot;Connect Pinterest Account&quot; above to re-authorize.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Pinterest Account</p>
            <p className="mt-1 font-bold text-sm text-surface-900 dark:text-white flex items-center gap-1.5">
              <span>@{username}</span>
              {isConnected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Target Board</p>
            <p className="mt-1 font-bold text-sm text-surface-900 dark:text-white truncate">
              {boardName}
            </p>
            <p className="text-[10px] text-surface-400 font-mono mt-0.5">ID: {boardId}</p>
          </div>

          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Pinned Prompts</p>
            <p className="mt-1 font-bold text-sm text-surface-900 dark:text-white">
              <span className="text-emerald-500">{pinnedCount}</span> / {publishedPosts.length} published
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Unpinned Queue</p>
            <p className="mt-1 font-bold text-sm text-surface-900 dark:text-white">
              <span className={unpinnedCount > 0 ? 'text-amber-500' : 'text-surface-400'}>
                {unpinnedCount} ready to pin
              </span>
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Toggle
              checked={currentPinterest.autoPublishNewPosts ?? true}
              onChange={(val) => handleUpdateConfig('autoPublishNewPosts', val)}
              label="Auto-publish new posts to Pinterest"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePublishAll}
              disabled={bulkPublishing || !isConnected || unpinnedCount === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                !isConnected || unpinnedCount === 0
                  ? 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20 active:scale-[0.98]'
              }`}
            >
              {bulkPublishing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Publishing unpinned prompts...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Publish All Unpinned ({unpinnedCount})
                </>
              )}
            </button>
          </div>
        </div>
      </Panel>

      {/* Production Access & RSS Auto-Publish Guide */}
      <Panel>
        <PanelHeader
          title="Important: Pinterest Access Level & Instant RSS Publishing"
          subtitle="Why Trial Access blocks direct API pins & how to publish immediately"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          {/* Option A: Instant RSS Feed Auto-Publish */}
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Recommended: Instant RSS Auto-Publish (Zero Approval Needed)</span>
            </div>
            <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
              Pinterest Business has a built-in auto-publisher that natively pulls all your prompts directly from your RSS feed. It creates rich pins automatically with <strong>zero API limitations</strong> and does not require developer approval.
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-500/20 flex items-center justify-between gap-2">
              <code className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                https://aipromptmatrix.in/feed.xml
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('https://aipromptmatrix.in/feed.xml');
                  showToast('RSS Feed URL copied to clipboard!', 'success');
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
              >
                Copy URL
              </button>
            </div>
            <div className="pt-1">
              <a
                href="https://www.pinterest.com/settings/claimed-accounts/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Open Pinterest Auto-publish Settings <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-surface-400 text-[11px] block mt-0.5">
                Go to Settings &rarr; Claimed Accounts (or Bulk Create) &rarr; Auto-publish from RSS &rarr; Paste URL &amp; select board &quot;Ai Image Prompts&quot;.
              </span>
            </div>
          </div>

          {/* Option B: Direct API Standard Access */}
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>For 1-Click Push Button: Upgrade to Standard Access</span>
            </div>
            <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
              Pinterest returned: <em>&quot;Apps with Trial access may not create Pins in production.&quot;</em> Pinterest gives new Developer Apps <strong>Trial Access</strong> by default. To use the direct &quot;Publish Pin&quot; API button on live boards, your app needs <strong>Standard Access</strong>.
            </p>
            <div className="space-y-1.5 text-surface-600 dark:text-surface-300">
              <p>1. Open your app in the Pinterest Developer portal.</p>
              <p>2. Under <strong>Access Level</strong>, click <strong>&quot;Apply for Standard Access&quot;</strong>.</p>
              <p>3. Submit the brief form (Purpose: &quot;Auto-publishing AI prompt artwork from our website to our brand Pinterest board&quot;).</p>
            </div>
            <div className="pt-1">
              <a
                href={`https://developers.pinterest.com/apps/${currentPinterest.appId || DEFAULT_PINTEREST_APP_ID}/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Upgrade App to Standard Access <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-surface-400 text-[11px] block mt-0.5">
                Once Pinterest approves Standard Access, the direct &quot;Publish Pin&quot; button works immediately!
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Advanced Credentials Panel */}
      <Panel>
        <PanelHeader
          title="App Credentials & Board Settings"
          subtitle="Configure your Pinterest Developer App credentials and target board ID"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="App ID">
            <input
              type="text"
              value={currentPinterest.appId || DEFAULT_PINTEREST_APP_ID}
              onChange={(e) => handleUpdateConfig('appId', e.target.value)}
              className={adminInput}
              placeholder="1610432"
            />
            <p className="text-xs text-surface-500 mt-1">Your Pinterest Developer App ID (e.g. 1610432)</p>
          </Field>

          <Field label="App Secret Key">
            <input
              type="password"
              value=""
              readOnly
              className={adminInput}
              placeholder="Stored as PINTEREST_APP_SECRET on the server"
            />
            <p className="text-xs text-surface-500 mt-1">Set this as the PINTEREST_APP_SECRET server secret. It is no longer stored in browser settings.</p>
          </Field>

          <Field label="Board ID">
            <input
              type="text"
              value={currentPinterest.boardId || DEFAULT_PINTEREST_BOARD_ID}
              onChange={(e) => handleUpdateConfig('boardId', e.target.value)}
              className={adminInput}
              placeholder="1124703775633314110"
            />
            <p className="text-xs text-surface-500 mt-1">The Pinterest board ID where pins should be published</p>
          </Field>

          <Field label="Board Name">
            <input
              type="text"
              value={currentPinterest.boardName || DEFAULT_PINTEREST_BOARD_NAME}
              onChange={(e) => handleUpdateConfig('boardName', e.target.value)}
              className={adminInput}
              placeholder="Ai Image Prompts"
            />
            <p className="text-xs text-surface-500 mt-1">Display label for the board</p>
          </Field>
        </div>

        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <Toggle
            checked={currentPinterest.useSandbox ?? false}
            onChange={(val) => handleUpdateConfig('useSandbox', val)}
            label="Use Pinterest API Sandbox (Test Mode)"
          />
          <p className="text-xs text-surface-400 mt-0.5 ml-11">
            When enabled, API requests hit api-sandbox.pinterest.com instead of live production api.pinterest.com.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-xs text-surface-500 dark:text-surface-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-surface-700 dark:text-surface-300">Redirect URI in Pinterest Developer Portal:</span>
            <code className="ml-2 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[11px] select-all">
              https://aipromptmatrix.in/api/pinterest/callback
            </code>
          </div>
          <a
            href="https://developers.pinterest.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            Open Pinterest Developer Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </Panel>

      {/* Prompts Publishing Queue & Status Table */}
      <Panel>
        <PanelHeader
          title="Published Prompts Pinterest Status"
          count={publishedPosts.length}
          subtitle="View pinned status and pin individual prompts with 1 click"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-surface-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="pb-3 font-bold pl-2">Prompt</th>
                <th className="pb-3 font-bold">AI Tool</th>
                <th className="pb-3 font-bold">Pinterest Status</th>
                <th className="pb-3 font-bold text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {publishedPosts.map((post) => {
                const isPinned = !!post.pinterestPinId;
                const isPublishing = publishingId === post.id;
                const imageUrl = post.thumbnailUrl || post.images?.[0]?.url;

                return (
                  <tr key={post.id} className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0 border border-black/5 dark:border-white/10 relative">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 m-auto text-surface-400 mt-3" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-sm">
                          <p className="font-bold text-surface-900 dark:text-white truncate">
                            {post.title}
                          </p>
                          <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate">
                            /{post.slug || post.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium text-[11px]">
                        {post.images?.[0]?.aiTool || post.aiTools?.[0] || 'AI'}
                      </span>
                    </td>

                    <td className="py-3 pr-4">
                      {isPinned ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Pinned
                          </span>
                          {post.pinterestUrl && (
                            <a
                              href={post.pinterestUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-surface-400 hover:text-rose-500 transition-colors p-1"
                              title="View on Pinterest"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
                          <Clock className="w-3 h-3" /> Not pinned
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-2 text-right">
                      <button
                        onClick={() => handlePublishSingle(post.id)}
                        disabled={isPublishing || !isConnected}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isPinned
                            ? 'border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-surface-700 dark:text-surface-300 hover:bg-white hover:text-rose-600'
                            : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-sm shadow-rose-500/20'
                        } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                      >
                        {isPublishing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{isPinned ? 'Re-pin' : 'Pin to Board'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
