'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Share2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink,
  UploadCloud, Sparkles, Image as ImageIcon, ShieldCheck,
  Send, Layers, Check, Clock
} from 'lucide-react';
import { TabBanner, Panel, PanelHeader, Field, Toggle, ActionButton, adminInput } from './AdminUI';
import { showToast } from '@/components/ui/ToastContainer';
import type { SiteSettings, PinterestSettings, Post } from '@/lib/types';
import {
  DEFAULT_PINTEREST_APP_ID,
  DEFAULT_PINTEREST_APP_SECRET,
  DEFAULT_PINTEREST_BOARD_ID,
  DEFAULT_PINTEREST_BOARD_NAME,
} from '@/lib/pinterest';

interface PinterestTabProps {
  settings: SiteSettings;
  updateSettings: (updater: (prev: SiteSettings) => SiteSettings) => void;
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

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/pinterest/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load Pinterest status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check URL params for oauth feedback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('pinterest') === 'connected') {
      showToast('Pinterest connected successfully! Board verified.', 'success');
      fetchStatus();
      onRefreshData?.();
    } else if (params.get('pinterest_error')) {
      showToast(`Pinterest connection failed: ${params.get('pinterest_error')}`, 'error');
    }
  }, [fetchStatus, onRefreshData]);

  const handleConnect = () => {
    if (status?.authUrl) {
      window.location.href = status.authUrl;
    } else {
      const url = `https://www.pinterest.com/oauth/?client_id=${currentPinterest.appId || DEFAULT_PINTEREST_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/pinterest/callback')}&response_type=code&scope=boards:read,boards:write,pins:read,pins:write,user_accounts:read`;
      window.location.href = url;
    }
  };

  const handleUpdateConfig = (field: keyof PinterestSettings, value: any) => {
    updateSettings(prev => ({
      ...prev,
      pinterestSettings: {
        ...prev.pinterestSettings,
        [field]: value,
      },
    }));
  };

  const handlePublishSingle = async (postId: string) => {
    try {
      setPublishingId(postId);
      const res = await fetch('/api/pinterest/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/pinterest/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
              description="Automatically pin prompts to Pinterest when published in the admin panel."
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

      {/* Advanced Credentials Panel */}
      <Panel>
        <PanelHeader
          title="App Credentials & Board Settings"
          subtitle="Configure your Pinterest Developer App credentials and target board ID"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="App ID" hint="Your Pinterest Developer App ID (e.g. 1610432)">
            <input
              type="text"
              value={currentPinterest.appId || DEFAULT_PINTEREST_APP_ID}
              onChange={(e) => handleUpdateConfig('appId', e.target.value)}
              className={adminInput}
              placeholder="1610432"
            />
          </Field>

          <Field label="App Secret Key" hint="Your Pinterest App Secret (used for token exchange & refresh)">
            <input
              type="password"
              value={currentPinterest.appSecret || DEFAULT_PINTEREST_APP_SECRET}
              onChange={(e) => handleUpdateConfig('appSecret', e.target.value)}
              className={adminInput}
              placeholder="c14f46..."
            />
          </Field>

          <Field label="Board ID" hint="The Pinterest board ID where pins should be published">
            <input
              type="text"
              value={currentPinterest.boardId || DEFAULT_PINTEREST_BOARD_ID}
              onChange={(e) => handleUpdateConfig('boardId', e.target.value)}
              className={adminInput}
              placeholder="1124703775633314110"
            />
          </Field>

          <Field label="Board Name" hint="Display label for the board">
            <input
              type="text"
              value={currentPinterest.boardName || DEFAULT_PINTEREST_BOARD_NAME}
              onChange={(e) => handleUpdateConfig('boardName', e.target.value)}
              className={adminInput}
              placeholder="Ai Image Prompts"
            />
          </Field>
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
