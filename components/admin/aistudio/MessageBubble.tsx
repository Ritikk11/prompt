'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Bot, User, Copy, Check, Download, Wand2, FilePlus, RefreshCw, Pencil,
} from 'lucide-react';
import Markdown from '@/components/MarkdownRenderer';
import type { ChatMessage } from '@/lib/admin/aistudio-store';

interface MessageBubbleProps {
  msg: ChatMessage;
  isStreaming?: boolean;
  modelLabel?: string;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onCreateArticle?: (content: string) => void;
  onCreatePost?: (promptText: string, imageUrl?: string) => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function MessageBubble({
  msg,
  isStreaming,
  modelLabel,
  onRegenerate,
  onEdit,
  onCreateArticle,
  onCreatePost,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const tokenEstimate = Math.max(1, Math.ceil(msg.content.length / 4));

  return (
    <div className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`flex max-w-[88%] flex-col sm:max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.imageUrl && (
          <div className="relative mb-2 h-32 w-48 overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700">
            <Image src={msg.imageUrl} alt="Attached asset" fill className="object-cover" unoptimized />
          </div>
        )}

        {msg.generatedImageUrl && (
          <div className="group mb-3 w-full max-w-sm overflow-hidden rounded-2xl border border-surface-200 bg-black shadow-md dark:border-surface-700">
            <div className="relative aspect-square w-full">
              <Image src={msg.generatedImageUrl} alt="Generated AI artwork" fill className="object-cover" unoptimized />
            </div>
            <div className="flex items-center justify-between gap-2 bg-surface-900/90 p-3 text-white backdrop-blur-md">
              <span className="truncate text-xs font-semibold">Generated Artwork</span>
              <div className="flex items-center gap-2">
                <a
                  href={msg.generatedImageUrl}
                  download="ai-generated-image.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
                  title="Download Image"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {onCreatePost && (
                  <button
                    onClick={() => onCreatePost(msg.content.replace(/^Generated image for prompt: "/, '').replace(/"$/, ''), msg.generatedImageUrl)}
                    className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-primary-500"
                  >
                    <Wand2 className="h-3 w-3" /> Create Post
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {(msg.content || isStreaming) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              isUser
                ? 'rounded-br-none bg-primary-600 text-white dark:bg-primary-500'
                : 'rounded-bl-none border border-surface-200/60 bg-surface-100 text-surface-900 dark:border-surface-700/60 dark:bg-surface-800/80 dark:text-surface-100'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            ) : (
              <div className="prose prose-sm prose-surface max-w-none dark:prose-invert prose-p:leading-relaxed">
                <Markdown>{msg.content}</Markdown>
                {isStreaming && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary-500 align-middle" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Metadata + actions (assistant only, once streaming has finished) */}
        {!isUser && !isStreaming && msg.content && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
            <div className="flex items-center gap-2 text-[10px] font-medium text-surface-400">
              {modelLabel && (
                <span className="rounded-full bg-surface-100 px-2 py-0.5 font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {modelLabel}
                </span>
              )}
              <span>{relativeTime(msg.createdAt)}</span>
              {!msg.isImage && <span>· ~{tokenEstimate} tok</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-surface-200" title="Copy response">
                {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Copied</span></> : <><Copy className="h-3.5 w-3.5" />Copy</>}
              </button>
              {onRegenerate && (
                <button onClick={onRegenerate} className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400" title="Regenerate response">
                  <RefreshCw className="h-3.5 w-3.5" />Regenerate
                </button>
              )}
              {onEdit && (
                <button onClick={onEdit} className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400" title="Edit your last message and resend">
                  <Pencil className="h-3.5 w-3.5" />Edit
                </button>
              )}
              {onCreateArticle && !msg.isImage && (
                <button onClick={() => onCreateArticle(msg.content)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400" title="Copy text & open Articles tab">
                  <FilePlus className="h-3.5 w-3.5" />Use as Article
                </button>
              )}
              {onCreatePost && !msg.isImage && (
                <button onClick={() => onCreatePost(msg.content)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400" title="Use as prompt for new post">
                  <Wand2 className="h-3.5 w-3.5" />Use as Post
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
