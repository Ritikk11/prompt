import type { Article, ArticleCategory } from './types';
import type { SiteSettings, ArticleSettingsOverride } from '../types';

import whatAreAiImagePrompts from './articles/what-are-ai-image-prompts';
import howToWriteBetterAiImagePrompts from './articles/how-to-write-better-ai-image-prompts';
import chatgptVsGeminiImageGeneration from './articles/chatgpt-vs-gemini-image-generation';
import anatomyOfAPerfectAiImagePrompt from './articles/anatomy-of-a-perfect-ai-image-prompt';
import commonAiPromptMistakes from './articles/common-ai-prompt-mistakes';
import aiImageAspectRatiosExplained from './articles/ai-image-aspect-ratios-explained';
import whoOwnsAiGeneratedImages from './articles/who-owns-ai-generated-images';
import consistentCharactersAiImages from './articles/consistent-characters-ai-images';
import aiPhotoTrends2026 from './articles/ai-photo-trends-2026';
import negativePromptsExplained from './articles/negative-prompts-explained';
import howAiImageGeneratorsWork from './articles/how-ai-image-generators-work';
import referenceImagesVsTextPrompts from './articles/reference-images-vs-text-prompts';
import howToUsePromptsFromPromptmatrix from './articles/how-to-use-prompts-from-promptmatrix';
import geminiPhotoEditingGuide from './articles/gemini-photo-editing-guide';
import chatgptImageGenerationGuide from './articles/chatgpt-image-generation-guide';
import figurinePhotoTrendGuide from './articles/3d-figurine-photo-trend-guide';
import retroSareePortraitGuide from './articles/retro-saree-portrait-guide';
import couplePortraitPromptsGuide from './articles/couple-portrait-prompts-guide';
import restoreOldPhotosWithAi from './articles/restore-old-photos-with-ai';
import aiHeadshotsGuide from './articles/ai-headshots-guide';
import animePortraitPromptsGuide from './articles/anime-portrait-prompts-guide';
import aiProductPhotographyGuide from './articles/ai-product-photography-guide';

export type { Article, ArticleCategory } from './types';

const allArticles: Article[] = [
  whatAreAiImagePrompts,
  howToWriteBetterAiImagePrompts,
  chatgptVsGeminiImageGeneration,
  anatomyOfAPerfectAiImagePrompt,
  commonAiPromptMistakes,
  aiImageAspectRatiosExplained,
  whoOwnsAiGeneratedImages,
  consistentCharactersAiImages,
  aiPhotoTrends2026,
  negativePromptsExplained,
  howAiImageGeneratorsWork,
  referenceImagesVsTextPrompts,
  howToUsePromptsFromPromptmatrix,
  geminiPhotoEditingGuide,
  chatgptImageGenerationGuide,
  figurinePhotoTrendGuide,
  retroSareePortraitGuide,
  couplePortraitPromptsGuide,
  restoreOldPhotosWithAi,
  aiHeadshotsGuide,
  animePortraitPromptsGuide,
  aiProductPhotographyGuide,
];

const byDateDesc = (a: Article, b: Article) =>
  new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime();

function isArticleIcon(value: unknown): value is Article['icon'] {
  return typeof value === 'string' && ['wand', 'image', 'book', 'camera', 'palette', 'shield', 'lightbulb', 'layers', 'trending', 'users', 'sparkles', 'settings'].includes(value);
}

function normalizeArticleOverride(input: ArticleSettingsOverride): Article | null {
  if (!input.slug || !input.title || !input.description || !input.body) return null;
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    category: input.category === 'guide' ? 'guide' : 'blog',
    tags: input.tags?.length ? input.tags : ['ai prompts'],
    readMinutes: input.readMinutes || 6,
    datePublished: input.datePublished || new Date().toISOString().slice(0, 10),
    dateModified: input.dateModified,
    icon: isArticleIcon(input.icon) ? input.icon : 'book',
    thumbnailUrl: input.thumbnailUrl,
    featured: input.featured,
    body: input.body,
  };
}

export function applyArticleSettings(article: Article, settings?: SiteSettings): Article {
  const override = settings?.articleOverrides?.[article.slug];
  const thumbnailUrl = override?.thumbnailUrl || settings?.articleThumbnails?.[article.slug] || article.thumbnailUrl;
  if (!override) return thumbnailUrl ? { ...article, thumbnailUrl } : article;
  return {
    ...article,
    ...override,
    slug: article.slug,
    category: override.category === 'guide' || override.category === 'blog' ? override.category : article.category,
    tags: override.tags?.length ? override.tags : article.tags,
    readMinutes: override.readMinutes || article.readMinutes,
    datePublished: override.datePublished || article.datePublished,
    icon: isArticleIcon(override.icon) ? override.icon : article.icon,
    thumbnailUrl,
    body: override.body || article.body,
  };
}

export function getArticlesForSettings(settings?: SiteSettings, category?: ArticleCategory): Article[] {
  const staticArticles = allArticles.map(article => applyArticleSettings(article, settings));
  const customArticles = (settings?.customArticles || [])
    .map(normalizeArticleOverride)
    .filter((article): article is Article => Boolean(article));
  const list = [...staticArticles, ...customArticles];
  return (category ? list.filter(a => a.category === category) : list).sort(byDateDesc);
}

export function getArticleForSettings(settings: SiteSettings | undefined, category: ArticleCategory, slug: string): Article | undefined {
  return getArticlesForSettings(settings, category).find(a => a.slug === slug);
}

export function getFeaturedGuidesForSettings(settings?: SiteSettings, limit = 4): Article[] {
  const guides = getArticlesForSettings(settings, 'guide');
  const featured = guides.filter(a => a.featured);
  const rest = guides.filter(a => !a.featured);
  return [...featured, ...rest].slice(0, limit);
}

export function getArticles(category?: ArticleCategory): Article[] {
  const list = category ? allArticles.filter(a => a.category === category) : allArticles;
  return [...list].sort(byDateDesc);
}

export function getArticle(category: ArticleCategory, slug: string): Article | undefined {
  return allArticles.find(a => a.category === category && a.slug === slug);
}

export function getFeaturedGuides(limit = 4): Article[] {
  const featured = allArticles.filter(a => a.category === 'guide' && a.featured);
  const rest = allArticles.filter(a => a.category === 'guide' && !a.featured).sort(byDateDesc);
  return [...featured, ...rest].slice(0, limit);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return allArticles
    .filter(a => a.slug !== article.slug)
    .map(a => ({
      article: a,
      score:
        a.tags.filter(t => article.tags.includes(t)).length +
        (a.category === article.category ? 1 : 0),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(x => x.article);
}

export function getRelatedArticlesForSettings(article: Article, settings?: SiteSettings, limit = 3): Article[] {
  return getArticlesForSettings(settings)
    .filter(a => a.slug !== article.slug)
    .map(a => ({
      article: a,
      score:
        a.tags.filter(t => article.tags.includes(t)).length +
        (a.category === article.category ? 1 : 0),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(x => x.article);
}
