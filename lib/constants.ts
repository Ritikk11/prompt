export const fallbackToolInfo: Record<string, { color: string; logo: string }> = {
  'ChatGPT': {
    color: 'bg-[#74aa9c]',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg'
  },
  'Gemini': {
    color: 'bg-[#4285f4]',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
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

export function getToolInfo(tool: string, customDetails?: Record<string, {logo?: string; color?: string; logoScale?: number}>) {
  if (customDetails && customDetails[tool]) {
    const custom = customDetails[tool];
    return {
      color: custom.color || fallbackToolInfo[tool]?.color || 'bg-surface-500',
      logo: custom.logo || fallbackToolInfo[tool]?.logo || '',
      logoScale: custom.logoScale
    };
  }
  return { color: fallbackToolInfo[tool]?.color || 'bg-surface-500', logo: fallbackToolInfo[tool]?.logo || '', logoScale: undefined };
}
