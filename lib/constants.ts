export const fallbackToolInfo: Record<string, { color: string; logo: string; logoScale?: number }> = {
  'ChatGPT': {
    color: 'bg-[#74aa9c]',
    logo: '/tool-logos/chatgpt.svg'
  },
  'Gemini': {
    color: 'bg-[#4285f4]',
    logo: '/tool-logos/gemini.svg'
  },
  'Grok': {
    color: 'bg-black',
    logo: '/tool-logos/grok.svg'
  },
  'Qwen': {
    color: 'bg-[#6366f1]',
    logo: '/tool-logos/qwen.svg'
  },
  'Qwen Image': {
    color: 'bg-[#6366f1]',
    logo: '/tool-logos/qwen.svg'
  }
};

export const defaultImageModels: Record<string, string> = {
  ChatGPT: 'GPT IMAGE 2.5',
  Gemini: 'Nano Banana Pro',
  Grok: 'Grok Imagine Image Quality',
  Qwen: 'Qwen-Image'
};

export const imageModelOptions: Record<string, string[]> = {
  ChatGPT: ['GPT IMAGE 2.5'],
  Gemini: ['Nano Banana Pro'],
  Grok: ['Grok Imagine Image Quality'],
  Qwen: ['Qwen-Image']
};

const defaultImageModelLookup = new Map(
  Object.entries(defaultImageModels).map(([tool, model]) => [tool.toLowerCase(), model])
);

export function getToolModels(tool?: string, toolDetails?: Record<string, any>): string[] {
  if (!tool) return [];
  const normalizedTool = tool.trim().toLowerCase();
  if (toolDetails) {
    const key = Object.keys(toolDetails).find(k => k.toLowerCase() === normalizedTool);
    if (key && toolDetails[key]?.models && Array.isArray(toolDetails[key].models)) {
      const customModels = toolDetails[key].models.filter((m: any) => Boolean(m && typeof m === 'string' && m.trim()));
      if (customModels.length > 0) {
        return customModels;
      }
    }
  }
  const defaultEntry = Object.entries(imageModelOptions).find(([k]) => k.toLowerCase() === normalizedTool);
  return defaultEntry ? defaultEntry[1] : [];
}

export function getAllModelOptionsForTools(tools: string[], toolDetails?: Record<string, any>): string[] {
  const models = new Set<string>();
  tools.forEach(t => {
    getToolModels(t, toolDetails).forEach(m => models.add(m));
  });
  return Array.from(models);
}

export function getDefaultImageModel(tool?: string, toolDetails?: Record<string, any>) {
  if (!tool) return '';
  const normalizedTool = tool.trim().toLowerCase();

  if (toolDetails) {
    const key = Object.keys(toolDetails).find(k => k.toLowerCase() === normalizedTool);
    if (key) {
      const details = toolDetails[key];
      if (details?.defaultModel && typeof details.defaultModel === 'string' && details.defaultModel.trim()) {
        return details.defaultModel.trim();
      }
      if (details?.models && Array.isArray(details.models) && details.models.length > 0) {
        const first = details.models.find((m: any) => Boolean(m && typeof m === 'string' && m.trim()));
        if (first) return first.trim();
      }
    }
  }

  return defaultImageModelLookup.get(normalizedTool) || '';
}

export function getImageDisplayModel(img?: { aiTool?: string; aiTools?: string[]; model?: string }, toolDetails?: Record<string, any>): string {
  if (!img) return '';
  const tools = (img.aiTools && img.aiTools.length > 0 ? img.aiTools : [img.aiTool]).filter(Boolean) as string[];
  const primaryTool = tools[0] || img.aiTool || '';
  if (!primaryTool) return img.model || '';

  const configuredModels = getToolModels(primaryTool, toolDetails);
  const defaultModel = getDefaultImageModel(primaryTool, toolDetails);

  if (configuredModels.length > 0) {
    if (img.model?.trim()) {
      const match = configuredModels.find(m => m.toLowerCase() === img.model!.trim().toLowerCase());
      if (match) return match;
    }
    return defaultModel || configuredModels[0] || primaryTool;
  }

  return img.model?.trim() || defaultModel || primaryTool;
}

export function getPromptImageMetas(img?: any, toolDetails?: Record<string, any>): Array<{ url: string; aiTool: string; aiTools: string[]; model: string; width?: number; height?: number }> {
  if (!img) return [];
  const urls = (img.urls && Array.isArray(img.urls) && img.urls.length > 0 ? img.urls : [img.url]).filter(Boolean) as string[];
  if (!urls.length) return [];

  const existingMetas: any[] = Array.isArray(img.imageMetas) ? img.imageMetas : [];
  const fallbackTool = img.aiTool || (Array.isArray(img.aiTools) && img.aiTools[0]) || 'ChatGPT';

  return urls.map((url, i) => {
    const existing = existingMetas[i] || existingMetas.find(m => m?.url === url);
    const tool = existing?.aiTool || (Array.isArray(existing?.aiTools) && existing.aiTools[0]) || fallbackTool;
    const tools = Array.isArray(existing?.aiTools) && existing.aiTools.length > 0 ? existing.aiTools : [tool];
    const rawModel = existing?.model || (i === 0 ? img.model : '') || getDefaultImageModel(tool, toolDetails);
    const model = getImageDisplayModel({ aiTool: tool, aiTools: tools, model: rawModel }, toolDetails);

    return {
      url,
      aiTool: tool,
      aiTools: tools,
      model,
      width: existing?.width || (i === 0 ? img.width : undefined),
      height: existing?.height || (i === 0 ? img.height : undefined),
    };
  });
}

export function isDefaultImageModel(model?: string, toolDetails?: Record<string, any>) {
  if (!model) return false;
  const normalizedModel = model.trim().toLowerCase();
  
  if (toolDetails) {
    const allCustomModels = Object.values(toolDetails)
      .flatMap((d: any) => d?.models || [])
      .filter((m: any) => Boolean(m && typeof m === 'string'))
      .map((m: string) => m.trim().toLowerCase());
    if (allCustomModels.length > 0 && allCustomModels.includes(normalizedModel)) {
      return true;
    }
  }

  const legacyDefaults = ['gpt image 2', 'gpt image 1', 'dall-e 3', 'nano banana 2', 'flux.1', 'imagen 3', 'qwen-image'];
  if (legacyDefaults.includes(normalizedModel)) return true;

  return Object.values(imageModelOptions).flat().some(option => option.toLowerCase() === normalizedModel);
}

export function getImageModelForTools(tools: string[], currentModel?: string, toolDetails?: Record<string, any>) {
  if (!tools || tools.length === 0) return currentModel || '';
  const defaultModel = getDefaultImageModel(tools[0], toolDetails);
  const available = getAllModelOptionsForTools(tools, toolDetails);

  if (currentModel?.trim()) {
    if (available.length > 0) {
      const match = available.find(m => m.toLowerCase() === currentModel.trim().toLowerCase());
      if (match) return match;
      const legacyDefaults = ['gpt image 2', 'gpt image 1', 'dall-e 3', 'nano banana 2', 'flux.1', 'imagen 3', 'qwen-image'];
      if (legacyDefaults.includes(currentModel.trim().toLowerCase())) {
        return defaultModel || currentModel;
      }
    }
    return defaultModel || currentModel;
  }

  return defaultModel || currentModel || '';
}

export function getToolForImageModel(model?: string, toolDetails?: Record<string, any>) {
  const normalizedModel = model?.trim().toLowerCase();
  if (!normalizedModel) return '';

  if (toolDetails) {
    const customMatch = Object.entries(toolDetails).find(([, details]: [string, any]) => {
      const toolModels = Array.isArray(details?.models) ? details.models : [];
      return toolModels.some((m: string) => m && m.toLowerCase() === normalizedModel);
    });
    if (customMatch) return customMatch[0];
  }

  const defaultMatch = Object.entries(imageModelOptions).find(([, models]) => models.some(option => option.toLowerCase() === normalizedModel));
  if (defaultMatch) return defaultMatch[0];
  if (normalizedModel.includes('gpt') || normalizedModel.includes('dall-e')) return 'ChatGPT';
  if (normalizedModel.includes('gemini') || normalizedModel.includes('nano banana')) return 'Gemini';
  if (normalizedModel.includes('grok')) return 'Grok';
  if (normalizedModel.includes('qwen')) return 'Qwen Image';
  return '';
}

export function getAllTools(post: any): string[] {
  const toolsSet = new Set<string>();
  if (post.aiTools && post.aiTools.length > 0) {
    post.aiTools.forEach((t: string) => toolsSet.add(t));
  }
  if (post.images) {
    post.images.forEach((img: any) => {
      if (img.imageMetas && Array.isArray(img.imageMetas)) {
        img.imageMetas.forEach((m: any) => {
          if (m?.aiTools && m.aiTools.length > 0) m.aiTools.forEach((t: string) => toolsSet.add(t));
          else if (m?.aiTool) toolsSet.add(m.aiTool);
        });
      }
      if (img.aiTools && img.aiTools.length > 0) {
        img.aiTools.forEach((t: string) => toolsSet.add(t));
      } else if (img.aiTool) {
        toolsSet.add(img.aiTool);
      }
    });
  }
  return Array.from(toolsSet);
}

// Admin can mark a tool inactive (AI Tools > Customize). Inactive tools must not
// surface on any public list — footer chips, home cards, hero, submit form.
export function isToolActive(tool: string, toolDetails?: Record<string, { active?: boolean }>) {
  if (!tool || !toolDetails) return true;
  const key = Object.keys(toolDetails).find(name => name.toLowerCase() === tool.trim().toLowerCase());
  return !key || toolDetails[key]?.active !== false;
}

export function getActiveTools(settings?: { aiTools?: string[]; toolDetails?: Record<string, { active?: boolean }> } | null): string[] {
  return (settings?.aiTools || []).filter(tool => isToolActive(tool, settings?.toolDetails));
}

export function getToolInfo(tool: string, customDetails?: Record<string, {logo?: string; color?: string; logoScale?: number}>) {
  const normalizedTool = tool?.trim();
  const fallbackEntry = Object.entries(fallbackToolInfo).find(([name]) => name.toLowerCase() === normalizedTool?.toLowerCase());
  const fallbackKey = fallbackEntry?.[0] || normalizedTool;
  const localFallback = fallbackEntry?.[1];

  // Keep core AI-tool logos local/repo-backed for speed and consistent circular rendering.
  // Admin custom logos still work for non-core tools.
  if (localFallback && ['/tool-logos/chatgpt.svg', '/tool-logos/gemini.svg', '/tool-logos/grok.svg', '/tool-logos/qwen.svg'].includes(localFallback.logo)) {
    const custom = customDetails?.[fallbackKey] || customDetails?.[normalizedTool];
    return {
      color: custom?.color || localFallback.color || 'bg-surface-500',
      logo: localFallback.logo,
      logoScale: undefined
    };
  }

  const custom = customDetails?.[fallbackKey] || customDetails?.[normalizedTool];
  if (custom) {
    return {
      color: custom.color || localFallback?.color || 'bg-surface-500',
      logo: custom.logo || localFallback?.logo || '',
      logoScale: custom.logoScale !== undefined ? custom.logoScale : localFallback?.logoScale
    };
  }
  return { color: localFallback?.color || 'bg-surface-500', logo: localFallback?.logo || '', logoScale: localFallback?.logoScale };
}

// Server-only settings bodies (legal/static page markdown) that no client
// component reads. Stripping them wherever full settings crosses into a client
// tree keeps ~60 kB out of every page's flight payload.
// NOTE: articleThumbnails + articleOverrides are NOT server-only — lib/content
// reads them client-side to resolve guide/blog card thumbnails, so they stay in
// the client settings or homepage article thumbs fall back to gradients.
const SERVER_ONLY_SETTINGS_KEYS = [
  'staticPages', 'pageTerms', 'pagePrivacy', 'pageCookies', 'pageDisclaimer',
  'pageAbout', 'pageContact', 'pageDmca',
] as const;

export function getClientSettings<T extends Record<string, any>>(settings: T): T {
  const copy: Record<string, any> = { ...settings };
  for (const key of SERVER_ONLY_SETTINGS_KEYS) delete copy[key];
  return copy as T;
}
