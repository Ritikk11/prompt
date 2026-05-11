export const fallbackToolInfo: Record<string, { color: string; logo: string; logoScale?: number }> = {
  'ChatGPT': {
    color: 'bg-[#74aa9c]',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg'
  },
  'Gemini': {
    color: 'bg-[#4285f4]',
    logo: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    logoScale: 1.5
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
  if (customDetails && customDetails[tool]) {
    const custom = customDetails[tool];
    return {
      color: custom.color || fallbackToolInfo[tool]?.color || 'bg-surface-500',
      logo: custom.logo || fallbackToolInfo[tool]?.logo || '',
      logoScale: custom.logoScale !== undefined ? custom.logoScale : fallbackToolInfo[tool]?.logoScale
    };
  }
  return { color: fallbackToolInfo[tool]?.color || 'bg-surface-500', logo: fallbackToolInfo[tool]?.logo || '', logoScale: fallbackToolInfo[tool]?.logoScale };
}
