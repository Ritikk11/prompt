import type { SiteSettings } from '@/lib/types';

export type AiProvider = 'gemini' | 'maas';

export interface ModelOption {
  id: string;
  label: string;
  short: string;
  provider: AiProvider | 'google-image';
  description?: string;
  isDefault?: boolean;
}

export const GEMINI_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash (Recommended Default)',
    short: 'Gemini 3.8',
    provider: 'gemini',
    description: "Google's latest flagship multimodal flash model. Fast, precise, and current.",
    isDefault: true,
  },
  {
    id: 'gemini-flash-latest',
    label: 'Gemini Flash Latest',
    short: 'Gemini Latest',
    provider: 'gemini',
    description: 'Dynamic alias always pointing to the most recent Gemini Flash model release.',
  },
  {
    id: 'gemini-3.7-flash',
    label: 'Gemini 3.7 Flash',
    short: 'Gemini 3.7',
    provider: 'gemini',
    description: 'High-speed multimodal generation with strong reasoning capabilities.',
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    short: 'Gemini 3.5',
    provider: 'gemini',
    description: 'Solid, reliable flash model with low latency and balanced throughput.',
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    short: 'Gemini Lite',
    provider: 'gemini',
    description: 'Lightweight, ultra-fast model ideal for high-volume quick tasks.',
  },
];

export const MAAS_MODELS: ModelOption[] = [
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro (Reasoning Default)',
    short: 'DeepSeek Pro',
    provider: 'maas',
    description: 'Flagship reasoning and copywriting model with deep structured output.',
    isDefault: true,
  },
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    short: 'DeepSeek Flash',
    provider: 'maas',
    description: 'High-speed DeepSeek model for fast generation and responsive completions.',
  },
  {
    id: 'qwen3.7-max',
    label: 'Qwen 3.7 Max',
    short: 'Qwen Max',
    provider: 'maas',
    description: 'Alibaba Cloud top-tier model with broad knowledge and comprehensive nuance.',
  },
  {
    id: 'qwen3.8-flash',
    label: 'Qwen 3.8 Flash (1M Context)',
    short: 'Qwen Flash',
    provider: 'maas',
    description: 'Massive 1M token context window for processing long source texts.',
  },
  {
    id: 'glm-5.1',
    label: 'GLM 5.1',
    short: 'GLM 5.1',
    provider: 'maas',
    description: 'Bilingual general-purpose powerhouse with great instruction following.',
  },
  {
    id: 'deepseek-v3.2',
    label: 'DeepSeek V3.2',
    short: 'DeepSeek 3.2',
    provider: 'maas',
    description: 'Stable generation model with high consistency for repetitive templates.',
  },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_MAAS_MODEL = 'deepseek-v4-pro';

export const GEMINI_FALLBACKS: readonly string[] = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
];

/**
 * Returns the active AI provider based on SiteSettings and environment availability.
 */
export function getActiveAiProvider(settings?: Partial<SiteSettings> | null): AiProvider {
  if (settings?.aiProvider === 'maas') return 'maas';
  if (settings?.aiProvider === 'gemini') return 'gemini';
  // If not explicitly configured, default to Gemini if GEMINI_API_KEY is present
  return process.env.GEMINI_API_KEY ? 'gemini' : 'maas';
}

/**
 * Returns the default Gemini model configured in settings or fallback.
 */
export function getGeminiModel(settings?: Partial<SiteSettings> | null): string {
  const model = settings?.geminiDefaultModel?.trim();
  if (model && GEMINI_MODELS.some(m => m.id === model)) {
    return model;
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Returns the default MaaS model configured in settings or fallback.
 */
export function getMaasModel(settings?: Partial<SiteSettings> | null): string {
  const model = settings?.maasDefaultModel?.trim();
  if (model && MAAS_MODELS.some(m => m.id === model)) {
    return model;
  }
  return DEFAULT_MAAS_MODEL;
}

/**
 * Returns the active default model based on the active provider.
 */
export function getActiveDefaultModel(settings?: Partial<SiteSettings> | null): string {
  const provider = getActiveAiProvider(settings);
  return provider === 'gemini' ? getGeminiModel(settings) : getMaasModel(settings);
}
