'use client';
import { createClient as createSupabaseClient } from '@/lib/supabase-client';

export interface AskAiOptions {
  systemContext?: string;
  imageUrl?: string;
  json?: boolean;
  model?: string;
  generateImage?: boolean;
  enableSearch?: boolean;
}

export interface AskAiResponse {
  text: string;
  generatedImageUrl?: string;
  isImage?: boolean;
}

export async function askAi(prompt: string, options: AskAiOptions = {}): Promise<string> {
  const res = await askAiFull(prompt, options);
  return res.text;
}

export async function askAiFull(prompt: string, options: AskAiOptions = {}): Promise<AskAiResponse> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/generate-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      prompt,
      systemContext: options.systemContext,
      imageUrl: options.imageUrl,
      json: options.json,
      model: options.model,
      generateImage: options.generateImage,
      enableSearch: options.enableSearch,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    text: data.text || '',
    generatedImageUrl: data.generatedImageUrl,
    isImage: data.isImage,
  };
}

export async function askAiJson<T>(prompt: string, options: Omit<AskAiOptions, 'json'> = {}): Promise<T> {
  const raw = await askAi(prompt, { ...options, json: true });
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export interface AskAiStreamOptions {
  systemContext?: string;
  model?: string;
  enableSearch?: boolean;
}

export interface AskAiStreamHandlers {
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

// Stream a multi-turn chat completion token-by-token. Reads the plain-text
// ReadableStream from /api/generate-text/stream via the Fetch reader API and
// calls onToken for each decoded chunk. Aborting `signal` stops the stream
// (surfaced to the caller as a DOMException with name 'AbortError').
export async function askAiStream(
  messages: StreamMessage[],
  options: AskAiStreamOptions,
  handlers: AskAiStreamHandlers
): Promise<void> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch('/api/generate-text/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      messages,
      systemContext: options.systemContext,
      model: options.model,
      enableSearch: options.enableSearch,
    }),
    signal: handlers.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error((await res.text().catch(() => '')) || 'AI stream failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) handlers.onToken(decoder.decode(value, { stream: true }));
  }
  handlers.onToken(decoder.decode());
}
