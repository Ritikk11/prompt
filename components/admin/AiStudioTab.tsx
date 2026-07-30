'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Wand2,
  Send,
  Upload,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  FileText,
  Tag,
  Search,
  Lightbulb,
  Image as ImageIcon,
  X,
  FilePlus,
  ArrowDown,
  Bot,
  User,
  RefreshCw,
} from 'lucide-react';
import { askAi } from '@/lib/admin/ai';
import { uploadImageFileToProvider } from '@/lib/client-upload';
import Markdown from '@/components/MarkdownRenderer';
import type { Post } from '@/lib/types';
import { TOOLS_MODELS_RULES } from '@/lib/admin/wandPrompts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface AiStudioTabProps {
  posts: Post[];
  onCreateArticleFromAi?: (content: string) => void;
  onCreatePostFromAi?: (promptText: string) => void;
}

export default function AiStudioTab({
  posts,
  onCreateArticleFromAi,
  onCreatePostFromAi,
}: AiStudioTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Build system context from current site data
  const getSystemContext = () => {
    const existingPostsContext = posts.slice(0, 5).map(p => ({ title: p.title, description: p.description }));
    const existingCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))).slice(0, 60);
    const existingTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 150);

    return `You are the in-house AI assistant for aipromptmatrix.in, a curated library of AI image-generation prompts (ChatGPT, Gemini, Grok, Qwen, Midjourney).
${TOOLS_MODELS_RULES}
Site structure notes:
- A "post" bundles example images generated from a text prompt, plus editorial notes.
- "tags" are short, lowercase, search/filter keywords (subject/style/tool). Existing tags: ${existingTags.length ? existingTags.join(', ') : '(none yet)'}
- "category" is one broad grouping. Existing categories: ${existingCategories.length ? existingCategories.join(', ') : '(none yet)'}
- Article bodies support custom markdown callouts: :::tip, :::creative, :::model, :::prompt, :::warning, and inline highlights like {mark:...}, {primary:...}. Use them appropriately.
- Do not use H1 (#) headings in article bodies.

Recent site posts for tone reference: ${JSON.stringify(existingPostsContext)}`;
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      imageUrl: attachedImageUrl || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInputPrompt('');
    const currentImage = attachedImageUrl;
    setAttachedImageUrl('');
    setIsLoading(true);

    try {
      // Build conversation thread context for multi-turn chat
      const conversationHistory = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = conversationHistory
        ? `Conversation History:\n${conversationHistory}\n\nUser: ${promptToSend}`
        : promptToSend;

      const responseText = await askAi(fullPrompt, {
        systemContext: getSystemContext(),
        imageUrl: currentImage,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error generating response**: ${err?.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    if (messages.length > 0 && !confirm('Clear current chat session?')) return;
    setMessages([]);
    setInputPrompt('');
    setAttachedImageUrl('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const url = await uploadImageFileToProvider(file, 'supabase', 'aistudio');
      setAttachedImageUrl(url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const presets = [
    {
      title: 'Write an Article',
      icon: FileText,
      prompt: "Write a detailed markdown article about 'How to write ChatGPT Image Prompts'. Include practical tips, structural steps, and example prompts.",
    },
    {
      title: 'Brainstorm Tags',
      icon: Tag,
      prompt: 'Suggest 10 trending AI image prompt tags and categories for a prompt gallery site.',
    },
    {
      title: 'SEO Meta Description',
      icon: Search,
      prompt: 'Write a catchy 160-character SEO meta description for an AI prompt collection featuring ChatGPT and Gemini.',
    },
    {
      title: 'Refine a Prompt',
      icon: Lightbulb,
      prompt: 'Improve this prompt to look photorealistic with professional studio lighting: "A portrait of a vintage saree fashion model in golden hour light".',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[600px] rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-950/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-surface-900 dark:text-white tracking-tight">
                AI Studio
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 text-[10px] font-bold border border-primary-200 dark:border-primary-800">
                <Sparkles className="w-3 h-3" /> Gemini Powered
              </span>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Conversational assistant trained on your site's structure & prompts
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-xs font-bold text-surface-600 dark:text-surface-300 transition-colors"
            title="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto py-8">
            <div className="w-14 h-14 rounded-3xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              What would you like to create?
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-8 leading-relaxed">
              Ask AI Studio to write long-form articles, generate SEO titles, suggest prompt tags, or refine image prompt text.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {presets.map(p => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.title}
                    onClick={() => handleSend(p.prompt)}
                    className="flex flex-col items-start p-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 hover:border-primary-500/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 text-left transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-surface-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      <IconComponent className="w-4 h-4 text-primary-500" />
                      {p.title}
                    </div>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 line-clamp-2">
                      {p.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat Message History */
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 md:gap-4 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Image attachment in bubble */}
                {msg.imageUrl && (
                  <div className="relative w-48 h-32 rounded-2xl overflow-hidden mb-2 border border-surface-200 dark:border-surface-700 shadow-sm">
                    <Image
                      src={msg.imageUrl}
                      alt="Attached asset"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                {/* Message Bubble Content */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white dark:bg-primary-500 shadow-sm rounded-br-none'
                      : 'bg-surface-100 dark:bg-surface-800/80 text-surface-900 dark:text-surface-100 border border-surface-200/60 dark:border-surface-700/60 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-surface dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-surface-900 prose-pre:text-surface-100 dark:prose-pre:bg-surface-950">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>

                {/* AI Assistant Action Buttons */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>

                    {onCreateArticleFromAi && (
                      <button
                        onClick={() => onCreateArticleFromAi(msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Create article draft from this response"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        Use as Article
                      </button>
                    )}

                    {onCreatePostFromAi && (
                      <button
                        onClick={() => onCreatePostFromAi(msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Create new post from this prompt"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Use as Post
                      </button>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-surface-700 dark:text-surface-200 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator Bubble */}
        {isLoading && (
          <div className="flex gap-3 md:gap-4 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl rounded-bl-none px-4 py-3 bg-surface-100 dark:bg-surface-800 border border-surface-200/60 dark:border-surface-700/60 text-surface-500 dark:text-surface-400 text-xs flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              AI Studio is generating thoughts...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Multimodal Input Bar Footer */}
      <div className="p-3 md:p-4 border-t border-surface-100 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-950/50 backdrop-blur-md shrink-0">
        {/* Attached image preview indicator */}
        {attachedImageUrl && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl w-fit">
            <div className="relative w-6 h-6 rounded overflow-hidden">
              <Image src={attachedImageUrl} alt="Attachment" fill className="object-cover" unoptimized />
            </div>
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Image Attached
            </span>
            <button
              onClick={() => setAttachedImageUrl('')}
              className="text-surface-400 hover:text-red-500 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700/80 rounded-2xl p-2 focus-within:border-primary-500 transition-colors shadow-sm">
          {/* Image Upload Input Button */}
          <label className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 dark:hover:text-surface-200 cursor-pointer transition-colors shrink-0">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploadingImage || isLoading}
            />
            {isUploadingImage ? (
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </label>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={e => {
              setInputPrompt(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI Studio anything... (Shift + Enter for new line)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-surface-900 dark:text-white placeholder:text-surface-400 resize-none py-1.5 max-h-40"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all disabled:opacity-40 disabled:hover:bg-primary-600 shrink-0 shadow-md shadow-primary-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
