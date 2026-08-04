'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Conversation,
  type ChatMessage,
  loadConversations,
  saveConversations,
  createConversation,
  deriveTitle,
} from '@/lib/admin/aistudio-store';

// Owns AI Studio conversation state and its localStorage mirror. Reads once on
// mount, writes on every change (after hydration so we never clobber saved
// chats with the empty initial state).
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Mirror of activeId that updates synchronously. updateActiveMessages reads
  // this (not the async state) so two mutations in the same tick — e.g.
  // appending the user message then the assistant message — target the same
  // conversation instead of each spawning a new one.
  const activeIdRef = useRef<string | null>(null);
  const setActiveId = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveIdState(id);
  }, []);

  useEffect(() => {
    const loaded = loadConversations().sort((a, b) => b.updatedAt - a.updatedAt);
    setConversations(loaded);
    if (loaded.length) setActiveId(loaded[0].id);
    setHydrated(true);
  }, [setActiveId]);

  useEffect(() => {
    if (!hydrated) return;
    // Debounced: streaming mutates state on every token, so coalesce the
    // localStorage writes instead of serializing the whole list each token.
    const t = window.setTimeout(() => saveConversations(conversations), 400);
    return () => window.clearTimeout(t);
  }, [conversations, hydrated]);

  const active = conversations.find(c => c.id === activeId) || null;

  const newChat = useCallback(() => {
    setConversations(prev => {
      // Reuse an existing empty chat instead of stacking blank sessions.
      const empty = prev.find(c => c.messages.length === 0);
      if (empty) {
        setActiveId(empty.id);
        return prev;
      }
      const conv = createConversation();
      setActiveId(conv.id);
      return [conv, ...prev];
    });
  }, [setActiveId]);

  const selectChat = useCallback((id: string) => setActiveId(id), [setActiveId]);

  const renameChat = useCallback((id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, title: clean } : c)));
  }, []);

  const deleteChat = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeIdRef.current === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }, [setActiveId]);

  // Mutate the active conversation's message list, creating a conversation if
  // none is active. Returns the conversation id that was updated.
  const updateActiveMessages = useCallback(
    (mutator: (messages: ChatMessage[]) => ChatMessage[]): string => {
      let targetId = activeIdRef.current;
      setConversations(prev => {
        let list = prev;
        let conv = prev.find(c => c.id === targetId);
        if (!conv) {
          conv = createConversation();
          targetId = conv.id;
          setActiveId(conv.id); // sets ref synchronously + schedules state update
          list = [conv, ...prev];
        }
        return list.map(c => {
          if (c.id !== targetId) return c;
          const messages = mutator(c.messages);
          return {
            ...c,
            messages,
            updatedAt: Date.now(),
            title: c.title === 'New chat' || !c.title ? deriveTitle(messages) : c.title,
          };
        });
      });
      return targetId ?? '';
    },
    [setActiveId]
  );

  const appendMessage = useCallback(
    (msg: ChatMessage) => updateActiveMessages(messages => [...messages, msg]),
    [updateActiveMessages]
  );

  const updateMessage = useCallback(
    (msgId: string, patch: Partial<ChatMessage> | ((m: ChatMessage) => ChatMessage)) => {
      updateActiveMessages(messages =>
        messages.map(m => {
          if (m.id !== msgId) return m;
          return typeof patch === 'function' ? patch(m) : { ...m, ...patch };
        })
      );
    },
    [updateActiveMessages]
  );

  return {
    conversations: [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    active,
    activeId,
    hydrated,
    newChat,
    selectChat,
    renameChat,
    deleteChat,
    appendMessage,
    updateMessage,
    updateActiveMessages,
  };
}
