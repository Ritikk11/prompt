// Server-side helper for Alibaba Cloud Model Studio (MaaS) / OpenAI-compatible endpoint.
// NOTE: Credentials MUST be provided via environment variables (MAAS_API_KEY, MAAS_BASE_URL).
// NEVER HARDCODE API KEYS OR ENDPOINTS IN SOURCE CODE.

export interface MaasChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface MaasCompletionOptions {
  model?: string;
  messages: MaasChatMessage[];
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
  enableSearch?: boolean;
  signal?: AbortSignal;
}

export const KNOWN_MAAS_MODELS = [
  'deepseek-v4-pro',
  'deepseek-v4-pro-0813',
  'deepseek-v4-flash',
  'deepseek-v4-flash-0731',
  'deepseek-v3.2',
  'qwen3.7-max',
  'qwen3.7-max-preview',
  'qwen3.7-max-2026-05-20',
  'qwen3.7-plus-2026-05-26',
  'qwen3.7-max-2026-05-17',
  'qwen3.8-flash',
  'qwen3.7-plus',
  'qwen3.6-plus',
  'qwen3.6-flash',
  'glm-5.1',
] as const;

export type MaasModelId = typeof KNOWN_MAAS_MODELS[number];

/**
 * Ordered fallback cascade for Post, Article, and Wand writing when a model
 * hits quota limits or fails.
 */
export const DEFAULT_POST_ARTICLE_FALLBACKS: readonly string[] = [
  'deepseek-v4-pro',
  'deepseek-v4-pro-0813',
  'deepseek-v4-flash',
  'deepseek-v4-flash-0731',
  'qwen3.7-max',
  'qwen3.7-max-preview',
  'qwen3.7-plus-2026-05-26',
  'qwen3.7-max-2026-05-20',
  'qwen3.7-max-2026-05-17',
  'qwen3.8-flash',
  'glm-5.1',
];

/**
 * Returns true if the MaaS endpoint and API key are configured in the environment.
 */
export function isMaasConfigured(): boolean {
  return Boolean(process.env.MAAS_API_KEY?.trim() && process.env.MAAS_BASE_URL?.trim());
}

/**
 * Returns the default model configured for MaaS or falls back to 'deepseek-v4-pro'.
 */
export function getMaasDefaultModel(): string {
  return process.env.MAAS_DEFAULT_MODEL?.trim() || 'deepseek-v4-pro';
}

/**
 * Determines whether a given model identifier should be routed to MaaS.
 */
export function isMaasModel(modelId?: string): boolean {
  if (!modelId) return false;
  const lower = modelId.toLowerCase();
  return (
    lower.startsWith('deepseek-') ||
    lower.startsWith('qwen') ||
    lower.startsWith('kimi') ||
    lower.startsWith('glm-') ||
    KNOWN_MAAS_MODELS.some((m) => m === lower)
  );
}

/**
 * Call MaaS chat completion (single-shot).
 */
export async function callMaasChatCompletion(options: MaasCompletionOptions): Promise<{
  content: string;
  reasoning_content?: string;
  usage?: any;
}> {
  const apiKey = process.env.MAAS_API_KEY?.trim();
  const baseUrl = process.env.MAAS_BASE_URL?.trim();

  if (!apiKey || !baseUrl) {
    throw new Error('MAAS_API_KEY and MAAS_BASE_URL environment variables must be configured.');
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const targetModel = options.model || getMaasDefaultModel();

  const bodyPayload: Record<string, any> = {
    model: targetModel,
    messages: options.messages,
  };

  if (typeof options.temperature === 'number') {
    bodyPayload.temperature = options.temperature;
  }
  if (typeof options.max_tokens === 'number') {
    bodyPayload.max_tokens = options.max_tokens;
  }
  if (options.json) {
    bodyPayload.response_format = { type: 'json_object' };
  }
  if (options.enableSearch) {
    bodyPayload.enable_search = true;
    bodyPayload.search_options = { forced_search: true };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`MaaS chat completion failed (${res.status} ${res.statusText}): ${errorText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message;
  const content = (choice?.content || '').trim();
  const reasoning_content = choice?.reasoning_content;

  return {
    content,
    reasoning_content,
    usage: data.usage,
  };
}

/**
 * Executes a MaaS chat completion through a fallback cascade of models.
 * If a model fails or encounters quota limits, the next model in the chain is attempted.
 */
export async function callMaasWithFallback(
  options: Omit<MaasCompletionOptions, 'model'> & {
    models?: readonly string[];
  }
): Promise<{
  content: string;
  reasoning_content?: string;
  modelUsed: string;
  usage?: any;
}> {
  const defaultList = [getMaasDefaultModel(), ...DEFAULT_POST_ARTICLE_FALLBACKS];
  const list = options.models && options.models.length > 0 ? options.models : defaultList;
  const modelsToTry = Array.from(new Set(list));

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const res = await callMaasChatCompletion({
        ...options,
        model,
      });
      return {
        ...res,
        modelUsed: model,
      };
    } catch (err: any) {
      console.warn(`[MaaS Fallback] Model ${model} failed (${err?.message || err}). Trying next candidate...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All MaaS fallback models failed.');
}

/**
 * Stream MaaS chat completion returning a standard Web ReadableStream of text chunks.
 */
export async function streamMaasChatCompletion(options: {
  model?: string;
  messages: MaasChatMessage[];
  temperature?: number;
  enableSearch?: boolean;
  signal?: AbortSignal;
}): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.MAAS_API_KEY?.trim();
  const baseUrl = process.env.MAAS_BASE_URL?.trim();

  if (!apiKey || !baseUrl) {
    throw new Error('MAAS_API_KEY and MAAS_BASE_URL environment variables must be configured.');
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const targetModel = options.model || getMaasDefaultModel();

  const bodyPayload: Record<string, any> = {
    model: targetModel,
    messages: options.messages,
    stream: true,
  };

  if (typeof options.temperature === 'number') {
    bodyPayload.temperature = options.temperature;
  }
  if (options.enableSearch) {
    bodyPayload.enable_search = true;
    bodyPayload.search_options = { forced_search: true };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`MaaS stream failed (${res.status} ${res.statusText}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // Ignore partial JSON parse errors in SSE chunks
            }
          }
        }
      } catch (streamErr: any) {
        if (streamErr?.name !== 'AbortError') {
          controller.enqueue(
            encoder.encode(`\n\n⚠️ Stream interrupted: ${streamErr?.message || 'unknown error'}`)
          );
        }
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Streams MaaS chat completion, attempting fallback models if initiation fails.
 */
export async function streamMaasWithFallback(options: {
  models?: readonly string[];
  messages: MaasChatMessage[];
  temperature?: number;
  enableSearch?: boolean;
  signal?: AbortSignal;
}): Promise<{ stream: ReadableStream<Uint8Array>; modelUsed: string }> {
  const defaultList = [getMaasDefaultModel(), ...DEFAULT_POST_ARTICLE_FALLBACKS];
  const list = options.models && options.models.length > 0 ? options.models : defaultList;
  const modelsToTry = Array.from(new Set(list));

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const stream = await streamMaasChatCompletion({
        model,
        messages: options.messages,
        temperature: options.temperature,
        enableSearch: options.enableSearch,
        signal: options.signal,
      });
      return { stream, modelUsed: model };
    } catch (err: any) {
      console.warn(`[MaaS Stream Fallback] Model ${model} failed to start stream: ${err?.message || err}. Trying next...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All MaaS fallback models failed to start stream.');
}
