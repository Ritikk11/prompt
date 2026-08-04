'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Check, X, Pencil } from 'lucide-react';
import type { Conversation } from '@/lib/admin/aistudio-store';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onRename,
  onDelete,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const startEdit = (c: Conversation) => {
    setEditingId(c.id);
    setDraft(c.title);
    setConfirmId(null);
  };

  const commitEdit = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-surface-50/60 dark:bg-surface-950/40">
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-surface-400">
            No conversations yet.
          </p>
        ) : (
          conversations.map(c => {
            const isActive = c.id === activeId;
            const isEditing = c.id === editingId;
            return (
              <div
                key={c.id}
                className={`group relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-800 dark:text-white'
                    : 'text-surface-600 hover:bg-white/60 dark:text-surface-300 dark:hover:bg-surface-800/50'
                }`}
              >
                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-primary-400 bg-transparent px-1.5 py-1 text-xs outline-none"
                    />
                    <button onClick={commitEdit} className="shrink-0 text-emerald-500 hover:text-emerald-600" title="Save">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="shrink-0 text-surface-400 hover:text-surface-600" title="Cancel">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : confirmId === c.id ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-rose-600 dark:text-rose-400">Delete this chat?</span>
                    <button
                      onClick={() => { onDelete(c.id); setConfirmId(null); }}
                      className="shrink-0 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-600"
                    >
                      Delete
                    </button>
                    <button onClick={() => setConfirmId(null)} className="shrink-0 text-surface-400 hover:text-surface-600" title="Cancel">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onSelect(c.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{c.title || 'New chat'}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => startEdit(c)} className="text-surface-400 hover:text-primary-500" title="Rename">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmId(c.id)} className="text-surface-400 hover:text-rose-500" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
