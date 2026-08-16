'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Wand2, Send, Sparkles, FileText, Tag, Image as ImageIcon, X, Bot,
  Cpu, Brain, Palette, ChevronDown, Zap, Square, Download, PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { askAiStream, askAiFull } from '@/lib/admin/ai';
import { aiStudioSystemContext } from '@/lib/admin/wandPrompts';
import { showToast } from '@/components/ui/ToastContainer';
import {
  type ChatMessage, newId, conversationToMarkdown,
} from '@/lib/admin/aistudio-store';
import { useConversations } from '@/components/admin/aistudio/useConversations';
import ChatSidebar from '@/components/admin/aistudio/ChatSidebar';
import MessageBubble from '@/components/admin/aistudio/MessageBubble';
import type { Post } from '@/lib/types';

export type GeminiModelId = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'imagen-3.0-generate-002';

interface AiStudioTabProps {
  posts: Post[];
  onCreateArticleFromAi?: (content: string) => void;
  onCreatePostFromAi?: (promptText: string, imageUrl?: string) => void;
}

const models: { id: GeminiModelId; label: string; short: string; icon: any; emoji: string }[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', short: 'Flash', icon: Zap, emoji: '⚡' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', short: 'Flash-Lite', icon: Cpu, emoji: '🚀' },
  { id: 'imagen-3.0-generate-002', label: 'Imagen 3 (Image Gen)', short: 'Imagen 3', icon: Palette, emoji: '🎨' },
];

const modelLabel = (id?: string) => models.find(m => m.id === id)?.label || id;

const presets = [
  { title: 'Write an Article', icon: FileText, prompt: "Write a detailed markdown article about 'How to write ChatGPT Image Prompts'. Include practical tips, structural steps, and example prompts.", model: 'gemini-2.5-flash' as GeminiModelId },
  { title: 'Generate AI Image', icon: Palette, prompt: 'A futuristic cyberpunk cat wearing neon goggles sitting on a rain-slicked Tokyo street at night, 8k resolution, photorealistic', model: 'imagen-3.0-generate-002' as GeminiModelId },
  { title: 'Brainstorm Tags', icon: Tag, prompt: 'Suggest 10 trending AI image prompt tags and categories for a prompt gallery site. Return them as a markdown table with columns Tag, Category, Why it works.', model: 'gemini-2.5-flash' as GeminiModelId },
  { title: 'Deep Coding & Logic', icon: Brain, prompt: 'Write a TypeScript utility function to parse and validate AI prompt tags from markdown frontmatter with unit test examples.', model: 'gemini-2.5-flash' as GeminiModelId },
];

export default function AiStudioTab({ posts, onCreateArticleFromAi, onCreatePostFromAi }: AiStudioTabProps) {
  const chat = useConversations();
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-2.5-flash');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [busy, setBusy] = useState(false);           // any generation in flight
  const [streamingId, setStreamingId] = useState<string | null>(null);
  // Sidebar is an overlay drawer on mobile and an inline pane on desktop.
  // Start closed so mobile doesn't cover the chat, then auto-open on desktop.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const messages = useMemo(() => chat.active?.messages ?? [], [chat.active?.messages]);

  const scrollToBottom = useCallback(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages.length, streamingId, scrollToBottom]);

  // Open the sidebar by default on desktop only (md breakpoint = 768px).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  // On mobile the sidebar overlays the chat, so dismiss it after picking a chat.
  const closeSidebarOnMobile = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Build the on-brand system context from live site taxonomy.
  const buildSystemContext = useCallback(() => {
    const recentPosts = posts.slice(0, 5).map(p => ({ title: p.title, description: p.description }));
    const existingCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))).slice(0, 60) as string[];
    const existingTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 150);
    return aiStudioSystemContext({ existingTags, existingCategories, recentPosts });
  }, [posts]);

  // Stream an assistant reply for the given request history (text models) or
  // generate an image (Imagen). `history` is the message list to send.
  const runAssistant = useCallback(
    async (history: ChatMessage[], model: GeminiModelId) => {
      setBusy(true);
      const isImageGen = model === 'imagen-3.0-generate-002';

      if (isImageGen) {
        try {
          const lastUser = [...history].reverse().find(m => m.role === 'user');
          const res = await askAiFull(lastUser?.content || '', { model, generateImage: true });
          chat.appendMessage({
            id: newId('assistant'), role: 'assistant',
            content: res.text, generatedImageUrl: res.generatedImageUrl,
            isImage: true, modelUsed: model, createdAt: Date.now(),
          });
        } catch (err: any) {
          chat.appendMessage({
            id: newId('error'), role: 'assistant',
            content: `⚠️ **Error generating image**: ${err?.message || 'Something went wrong.'}`,
            createdAt: Date.now(),
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      const assistantId = newId('assistant');
      chat.appendMessage({ id: assistantId, role: 'assistant', content: '', modelUsed: model, createdAt: Date.now() });
      setStreamingId(assistantId);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await askAiStream(
          history.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })),
          { systemContext: buildSystemContext(), model },
          {
            signal: controller.signal,
            onToken: (t) => chat.updateMessage(assistantId, m => ({ ...m, content: m.content + t })),
          }
        );
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          chat.updateMessage(assistantId, m => ({ ...m, content: m.content + '\n\n_⏹ Stopped._' }));
        } else {
          chat.updateMessage(assistantId, m => ({
            ...m,
            content: m.content || `⚠️ **Error generating response**: ${err?.message || 'Something went wrong.'}`,
          }));
        }
      } finally {
        setStreamingId(null);
        setBusy(false);
        abortRef.current = null;
      }
    },
    [chat, buildSystemContext]
  );

  const send = useCallback(
    async (customPrompt?: string, overrideModel?: GeminiModelId) => {
      const promptToSend = (customPrompt ?? inputPrompt).trim();
      if (!promptToSend || busy) return;
      const model = overrideModel || selectedModel;

      const userMsg: ChatMessage = {
        id: newId('user'), role: 'user', content: promptToSend,
        imageUrl: attachedImageUrl || undefined, createdAt: Date.now(),
      };
      chat.appendMessage(userMsg);
      if (!customPrompt) setInputPrompt('');
      setAttachedImageUrl('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      await runAssistant([...messages, userMsg], model);
    },
    [inputPrompt, busy, selectedModel, attachedImageUrl, chat, messages, runAssistant]
  );

  // Drop trailing assistant messages, resend from the last user turn.
  const regenerate = useCallback(async () => {
    if (busy) return;
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    const history = messages.slice(0, lastUserIdx + 1);
    chat.updateActiveMessages(() => history);
    const model = (models.find(m => m.id === messages[lastUserIdx + 1]?.modelUsed)?.id as GeminiModelId) || selectedModel;
    await runAssistant(history, model);
  }, [busy, messages, chat, selectedModel, runAssistant]);

  // Load the last user message back into the composer and truncate it away so
  // the admin can revise and resend.
  const editLast = useCallback(() => {
    if (busy) return;
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    const lastUser = messages[lastUserIdx];
    setInputPrompt(lastUser.content);
    if (lastUser.imageUrl) setAttachedImageUrl(lastUser.imageUrl);
    chat.updateActiveMessages(() => messages.slice(0, lastUserIdx));
    textareaRef.current?.focus();
  }, [busy, messages, chat]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const exportChat = useCallback(() => {
    if (!chat.active || !messages.length) return;
    const md = conversationToMarkdown(chat.active);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(chat.active.title || 'chat').replace(/[^\w-]+/g, '-').slice(0, 40)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported as Markdown', 'success');
  }, [chat.active, messages.length]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => { setAttachedImageUrl(reader.result as string); setIsUploadingImage(false); };
    reader.onerror = () => { showToast('Failed to process image file', 'error'); setIsUploadingImage(false); };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const activeModel = models.find(m => m.id === selectedModel)!;

  return (
    <div className="relative mx-auto flex h-[640px] max-h-[80vh] min-h-0 w-full max-w-6xl overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-xl animate-in fade-in duration-200 dark:border-surface-800 dark:bg-surface-900 sm:min-h-[480px]">
      {/* Backdrop for the mobile drawer */}
      {sidebarOpen && (
        <button
          aria-label="Close chat list"
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-20 bg-surface-950/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar — overlay drawer on mobile, inline collapsible pane on desktop */}
      <div
        className={`absolute inset-y-0 left-0 z-30 w-[17rem] max-w-[82%] shrink-0 overflow-hidden border-r border-surface-100 bg-white shadow-2xl transition-transform duration-200 dark:border-surface-800/80 dark:bg-surface-900 md:static md:z-auto md:max-w-none md:bg-transparent md:shadow-none md:transition-[width] md:dark:bg-transparent ${
          sidebarOpen ? 'translate-x-0 md:w-60' : '-translate-x-full md:w-0 md:translate-x-0'
        }`}
      >
        <ChatSidebar
          conversations={chat.conversations}
          activeId={chat.activeId}
          onNew={() => { if (!busy) { chat.newChat(); closeSidebarOnMobile(); } }}
          onSelect={(id) => { if (!busy) { chat.selectChat(id); closeSidebarOnMobile(); } }}
          onRename={chat.renameChat}
          onDelete={(id) => { if (!busy) chat.deleteChat(id); }}
        />
      </div>

      {/* Chat pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-surface-100 bg-surface-50/50 px-4 py-3.5 backdrop-blur-md dark:border-surface-800/80 dark:bg-surface-950/40 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
              title={sidebarOpen ? 'Hide chats' : 'Show chats'}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20 sm:flex">
              <Wand2 className="h-4 w-4" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="shrink-0 text-sm font-extrabold tracking-tight text-surface-900 dark:text-white sm:text-base">AI Studio</h1>
              <div className="relative inline-block">
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value as GeminiModelId)}
                  className="cursor-pointer appearance-none rounded-full border border-primary-200 bg-primary-100 py-1 pl-7 pr-7 text-[11px] font-bold text-primary-600 outline-none transition-colors hover:border-primary-400 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-400"
                >
                  {models.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
                </select>
                <Sparkles className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-primary-500" />
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-primary-500" />
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={exportChat}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-surface-100 px-3 py-1.5 text-xs font-bold text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              title="Export conversation as Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={chatScrollRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center px-4 py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mb-1.5 text-lg font-bold text-surface-900 dark:text-white">What can I help you create today?</h2>
              <p className="mb-6 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                Write articles, code custom site features, generate AI images, or refine prompts with Gemini &amp; Imagen models. Chats are saved in this browser.
              </p>
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {presets.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.title}
                      onClick={() => { chat.newChat(); setSelectedModel(p.model); send(p.prompt, p.model); }}
                      className="group flex flex-col items-start rounded-2xl border border-surface-200 bg-surface-50/50 p-3.5 text-left transition-all duration-200 hover:border-primary-500/50 hover:bg-primary-50/30 dark:border-surface-800 dark:bg-surface-800/40 dark:hover:bg-primary-950/20"
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-bold text-surface-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                        <Icon className="h-3.5 w-3.5 text-primary-500" />
                        {p.title}
                      </div>
                      <p className="line-clamp-2 text-[11px] text-surface-500 dark:text-surface-400">{p.prompt}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isLastAssistant = msg.role === 'assistant' && idx === messages.length - 1;
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isStreaming={streamingId === msg.id}
                  modelLabel={modelLabel(msg.modelUsed)}
                  onRegenerate={isLastAssistant && !busy ? regenerate : undefined}
                  onEdit={isLastAssistant && !busy ? editLast : undefined}
                  onCreateArticle={onCreateArticleFromAi}
                  onCreatePost={onCreatePostFromAi}
                />
              );
            })
          )}

          {/* Image-gen spinner (streaming text shows its own caret) */}
          {busy && !streamingId && (
            <div className="flex justify-start gap-3 md:gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-surface-200/60 bg-surface-100 px-4 py-3 text-xs text-surface-500 dark:border-surface-700/60 dark:bg-surface-800 dark:text-surface-400">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                Generating AI image artwork...
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-surface-100 bg-surface-50/50 p-3 backdrop-blur-md dark:border-surface-800/80 dark:bg-surface-950/50 md:p-4">
          {attachedImageUrl && (
            <div className="mb-2 flex w-fit items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-1.5 dark:border-surface-700 dark:bg-surface-800">
              <div className="relative h-6 w-6 overflow-hidden rounded">
                <Image src={attachedImageUrl} alt="Attachment" fill className="object-cover" unoptimized />
              </div>
              <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Image Attached</span>
              <button onClick={() => setAttachedImageUrl('')} className="ml-1 text-surface-400 transition-colors hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-surface-200 bg-white p-2 transition-colors focus-within:border-primary-500 dark:border-surface-700/80 dark:bg-surface-900">
            <label className="shrink-0 cursor-pointer rounded-xl p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage || busy} />
              {isUploadingImage
                ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                : <ImageIcon className="h-5 w-5" />}
            </label>

            <textarea
              ref={textareaRef}
              value={inputPrompt}
              onChange={e => {
                setInputPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={activeModel.id === 'imagen-3.0-generate-002' ? 'Describe the image you want to generate...' : 'Ask AI Studio anything... (Shift + Enter for new line)'}
              rows={1}
              disabled={busy}
              className="max-h-40 flex-1 resize-none border-0 bg-transparent py-1.5 text-xs text-surface-900 outline-none placeholder:text-surface-400 dark:text-white md:text-sm"
            />

            {streamingId ? (
              <button
                onClick={stop}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-surface-800 px-3 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-surface-900 dark:bg-surface-700 dark:hover:bg-surface-600"
                title="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => send()}
                disabled={busy || !inputPrompt.trim()}
                className="shrink-0 rounded-xl bg-primary-600 p-2.5 font-bold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
