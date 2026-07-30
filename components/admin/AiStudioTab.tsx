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
  Download,
  ExternalLink,
  Cpu,
  Brain,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { askAiFull } from '@/lib/admin/ai';
import Markdown from '@/components/MarkdownRenderer';
import type { Post } from '@/lib/types';
import { TOOLS_MODELS_RULES } from '@/lib/admin/wandPrompts';

export type GeminiModelId = 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'imagen-3.0-generate-002';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  generatedImageUrl?: string;
  isImage?: boolean;
  modelUsed?: string;
  timestamp: Date;
}

interface AiStudioTabProps {
  posts: Post[];
  onCreateArticleFromAi?: (content: string) => void;
  onCreatePostFromAi?: (promptText: string, imageUrl?: string) => void;
}

export default function AiStudioTab({
  posts,
  onCreateArticleFromAi,
  onCreatePostFromAi,
}: AiStudioTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-2.0-flash');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat container only
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isLoading]);

  // Build system context from current site data
  const getSystemContext = () => {
    const existingPostsContext = posts.slice(0, 5).map(p => ({ title: p.title, description: p.description }));
    const existingCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))).slice(0, 60);
    const existingTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 150);

    return `You are the expert AI assistant & lead engineer for aipromptmatrix.in, a gallery/library of AI image prompts (ChatGPT, Gemini, Grok, Qwen, Midjourney).
${TOOLS_MODELS_RULES}
Site structure notes:
- A "post" bundles example images generated from a text prompt, plus editorial notes.
- "tags" are short, lowercase keywords (subject/style/tool). Existing tags: ${existingTags.length ? existingTags.join(', ') : '(none yet)'}
- "category" is a broad grouping. Existing categories: ${existingCategories.length ? existingCategories.join(', ') : '(none yet)'}
- Long-form article bodies support custom callouts: :::tip, :::creative, :::model, :::prompt, :::warning, and inline highlights like {mark:...}, {primary:...}.
- Write clean markdown with code block syntax highlighting (\`\`\`typescript ... \`\`\`) for technical instructions.

Recent site posts for tone reference: ${JSON.stringify(existingPostsContext)}`;
  };

  const handleSend = async (customPrompt?: string, overrideModel?: GeminiModelId) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    const activeModel = overrideModel || selectedModel;
    const isImageGen = activeModel === 'imagen-3.0-generate-002';

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

      const response = await askAiFull(fullPrompt, {
        systemContext: getSystemContext(),
        imageUrl: currentImage,
        model: activeModel,
        generateImage: isImageGen,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        generatedImageUrl: response.generatedImageUrl,
        isImage: response.isImage || !!response.generatedImageUrl,
        modelUsed: activeModel,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImageUrl(reader.result as string);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to process image file');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const models: { id: GeminiModelId; label: string; icon: any; desc: string; badge: string }[] = [
    {
      id: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      icon: Zap,
      desc: 'Fast, multimodal, text & code generation',
      badge: 'Fastest',
    },
    {
      id: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      icon: Brain,
      desc: 'Deep reasoning, complex coding & long context',
      badge: 'Smartest',
    },
    {
      id: 'imagen-3.0-generate-002',
      label: 'Imagen 3 (Image Gen)',
      icon: Palette,
      desc: 'Generate photorealistic 1024x1024 AI images',
      badge: 'Image Gen',
    },
  ];

  const presets = [
    {
      title: 'Write an Article',
      icon: FileText,
      prompt: "Write a detailed markdown article about 'How to write ChatGPT Image Prompts'. Include practical tips, structural steps, and example prompts.",
      model: 'gemini-2.0-flash' as GeminiModelId,
    },
    {
      title: 'Generate AI Image',
      icon: Palette,
      prompt: 'A futuristic cyberpunk cat wearing neon goggles sitting on a rain-slicked Tokyo street at night, 8k resolution, photorealistic',
      model: 'imagen-3.0-generate-002' as GeminiModelId,
    },
    {
      title: 'Brainstorm Tags',
      icon: Tag,
      prompt: 'Suggest 10 trending AI image prompt tags and categories for a prompt gallery site.',
      model: 'gemini-2.0-flash' as GeminiModelId,
    },
    {
      title: 'Deep Coding & Logic',
      icon: Brain,
      prompt: 'Write a TypeScript utility function to parse and validate AI prompt tags from markdown frontmatter with unit test examples.',
      model: 'gemini-1.5-pro' as GeminiModelId,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[600px] max-h-[75vh] min-h-[500px] rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-surface-100 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-950/40 backdrop-blur-md shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-surface-900 dark:text-white tracking-tight">
                AI Studio
              </h1>
              {/* Model Picker Pill */}
              <div className="relative inline-block">
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value as GeminiModelId)}
                  className="appearance-none pl-7 pr-7 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 text-[11px] font-bold border border-primary-200 dark:border-primary-800 cursor-pointer outline-none hover:border-primary-400 transition-colors"
                >
                  <option value="gemini-2.0-flash">⚡ Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro</option>
                  <option value="imagen-3.0-generate-002">🎨 Imagen 3 (Image Gen)</option>
                </select>
                <Sparkles className="w-3 h-3 text-primary-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3 h-3 text-primary-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-xs font-bold text-surface-600 dark:text-surface-300 transition-colors shrink-0"
            title="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto py-6">
            <div className="w-12 h-12 rounded-3xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-1.5">
              What can I help you create today?
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 leading-relaxed">
              Write articles, code custom site features, generate AI images, or refine prompts with Gemini & Imagen models.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {presets.map(p => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.title}
                    onClick={() => {
                      setSelectedModel(p.model);
                      handleSend(p.prompt, p.model);
                    }}
                    className="flex flex-col items-start p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 hover:border-primary-500/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 text-left transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-surface-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      <IconComponent className="w-3.5 h-3.5 text-primary-500" />
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
                className={`flex flex-col max-w-[88%] sm:max-w-[82%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Attached Image */}
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

                {/* AI Generated Image Output */}
                {msg.generatedImageUrl && (
                  <div className="relative w-full max-w-sm rounded-2xl overflow-hidden mb-3 border border-surface-200 dark:border-surface-700 shadow-md group bg-black">
                    <div className="relative aspect-square w-full">
                      <Image
                        src={msg.generatedImageUrl}
                        alt="Generated AI artwork"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3 bg-surface-900/90 text-white flex items-center justify-between gap-2 backdrop-blur-md">
                      <span className="text-xs font-semibold truncate">Generated Artwork</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={msg.generatedImageUrl}
                          download="ai-generated-image.jpg"
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {onCreatePostFromAi && (
                          <button
                            onClick={() => onCreatePostFromAi(msg.content.replace(/^Generated image for prompt: "/, '').replace(/"$/, ''), msg.generatedImageUrl)}
                            className="px-2.5 py-1 bg-primary-600 hover:bg-primary-500 rounded-lg text-[11px] font-bold text-white transition-colors flex items-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" /> Create Post
                          </button>
                        )}
                      </div>
                    </div>
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
                  <div className="flex items-center gap-2.5 mt-1.5 px-1 flex-wrap">
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

                    {onCreateArticleFromAi && !msg.isImage && (
                      <button
                        onClick={() => onCreateArticleFromAi(msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Copy text & open Articles tab"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        Use as Article
                      </button>
                    )}

                    {onCreatePostFromAi && !msg.isImage && (
                      <button
                        onClick={() => onCreatePostFromAi(msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Use as prompt for new post"
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
              {selectedModel === 'imagen-3.0-generate-002'
                ? 'Generating AI image artwork...'
                : 'Gemini is generating response...'}
            </div>
          </div>
        )}
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
            placeholder={
              selectedModel === 'imagen-3.0-generate-002'
                ? 'Describe the image you want to generate...'
                : 'Ask AI Studio anything... (Shift + Enter for new line)'
            }
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
