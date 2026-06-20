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
  },
  'Midjourney': {
    color: 'bg-surface-900',
    logo: 'https://avatars.githubusercontent.com/u/101824364?s=200&v=4'
  },
  'DALL-E': {
    color: 'bg-[#ef4444]',
    logo: 'https://www.vectorlogo.zone/logos/openai/openai-icon.svg'
  },
  'Stable Diffusion': {
    color: 'bg-[#7c3aed]',
    logo: 'https://stability.ai/favicon.ico'
  },
  'Claude': {
    color: 'bg-[#d97706]',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Claude_AI_logo.svg'
  }
};

export const defaultImageModels: Record<string, string> = {
  ChatGPT: 'GPT Image 2',
  Gemini: 'Nano Banana 2',
  Grok: 'Grok Imagine Image Quality',
  Qwen: 'Qwen-Image'
};

export const imageModelOptions: Record<string, string[]> = {
  ChatGPT: ['GPT Image 2'],
  Gemini: ['Nano Banana 2', 'Nano Banana Pro'],
  Grok: ['Grok Imagine Image Quality'],
  Qwen: ['Qwen-Image']
};

const defaultImageModelLookup = new Map(
  Object.entries(defaultImageModels).map(([tool, model]) => [tool.toLowerCase(), model])
);

export function getDefaultImageModel(tool?: string) {
  if (!tool) return '';
  return defaultImageModelLookup.get(tool.trim().toLowerCase()) || '';
}

export function isDefaultImageModel(model?: string) {
  if (!model) return false;
  const normalizedModel = model.trim().toLowerCase();
  return Object.values(imageModelOptions).flat().some(option => option.toLowerCase() === normalizedModel);
}

export function getImageModelForTools(tools: string[], currentModel?: string) {
  const defaultModel = getDefaultImageModel(tools[0]);
  if (!defaultModel) return currentModel || '';
  return !currentModel?.trim() || isDefaultImageModel(currentModel) ? defaultModel : currentModel;
}
export function getToolForImageModel(model?: string) {
  const normalizedModel = model?.trim().toLowerCase();
  if (!normalizedModel) return '';
  const defaultMatch = Object.entries(imageModelOptions).find(([, models]) => models.some(option => option.toLowerCase() === normalizedModel));
  if (defaultMatch) return defaultMatch[0];
  if (normalizedModel.includes('gpt') || normalizedModel.includes('dall-e')) return 'ChatGPT';
  if (normalizedModel.includes('gemini') || normalizedModel.includes('nano banana')) return 'Gemini';
  if (normalizedModel.includes('grok')) return 'Grok';
  if (normalizedModel.includes('qwen')) return 'Qwen';
  return '';
}

export function getAllTools(post: any): string[] {
  const toolsSet = new Set<string>();
  if (post.aiTools && post.aiTools.length > 0) {
    post.aiTools.forEach((t: string) => toolsSet.add(t));
  }
  if (post.images) {
    post.images.forEach((img: any) => {
      if (img.aiTools && img.aiTools.length > 0) {
        img.aiTools.forEach((t: string) => toolsSet.add(t));
      } else if (img.aiTool) {
        toolsSet.add(img.aiTool);
      }
    });
  }
  return Array.from(toolsSet);
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
