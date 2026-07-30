'use client';
import { createClient as createSupabaseClient } from '@/lib/supabase-client';

export interface AskAiOptions {
  systemContext?: string;
  imageUrl?: string;
  json?: boolean;
  model?: string;
  generateImage?: boolean;
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
