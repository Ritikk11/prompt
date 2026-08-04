// AI Studio conversation persistence. Chats live only in the browser
// (localStorage) per product decision — no server table. Timestamps are stored
// as numbers (not Date) so JSON round-trips cleanly, and large base64 image
// data URLs are stripped before persisting so a few generated images can't blow
// the ~5 MB localStorage quota (they stay available in-session only).

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  imageUrl?: string;          // user-attached image (data URL, in-session only)
  generatedImageUrl?: string; // AI-generated image (data URL or remote, in-session only)
  isImage?: boolean;
  modelUsed?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'pv-aistudio-chats';
const MAX_CONVERSATIONS = 50;

// Unique enough for client-side ids without pulling in a uuid dependency.
export function newId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// First user message, trimmed to a short sidebar label.
export function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  const raw = (firstUser?.content || '').replace(/\s+/g, ' ').trim();
  if (!raw) return 'New chat';
  return raw.length > 42 ? `${raw.slice(0, 42)}…` : raw;
}

// Data URLs (base64) are far too big for localStorage — drop them before
// persisting. A short marker keeps the message layout sensible on reload.
function stripHeavyImages(conv: Conversation): Conversation {
  const isHeavy = (url?: string) => !!url && url.startsWith('data:');
  return {
    ...conv,
    messages: conv.messages.map(m => {
      if (!isHeavy(m.imageUrl) && !isHeavy(m.generatedImageUrl)) return m;
      const next = { ...m };
      if (isHeavy(next.imageUrl)) delete next.imageUrl;
      if (isHeavy(next.generatedImageUrl)) delete next.generatedImageUrl;
      return next;
    }),
  };
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Conversation =>
        c && typeof c.id === 'string' && Array.isArray(c.messages)
    );
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = conversations
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS)
      .map(stripHeavyImages);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or storage disabled — fail silently; the in-memory
    // state is still the source of truth for the current session.
  }
}

export function createConversation(): Conversation {
  const now = Date.now();
  return { id: newId('conv'), title: 'New chat', messages: [], createdAt: now, updatedAt: now };
}

// Serialize a conversation to a Markdown transcript for the Export button.
export function conversationToMarkdown(conv: Conversation): string {
  const header = `# ${conv.title}\n\n_Exported from AI Studio · ${new Date(conv.updatedAt).toLocaleString()}_\n`;
  const body = conv.messages
    .map(m => {
      const who = m.role === 'user' ? '## 🧑 You' : `## 🤖 Assistant${m.modelUsed ? ` (${m.modelUsed})` : ''}`;
      return `${who}\n\n${m.content}\n`;
    })
    .join('\n---\n\n');
  return `${header}\n${body}`;
}
