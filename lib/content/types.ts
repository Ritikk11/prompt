export type ArticleCategory = 'blog' | 'guide';

export type ArticleIcon =
  | 'wand'
  | 'image'
  | 'book'
  | 'camera'
  | 'palette'
  | 'shield'
  | 'lightbulb'
  | 'layers'
  | 'trending'
  | 'users'
  | 'sparkles'
  | 'settings';

export interface Article {
  slug: string;
  title: string;
  /** Meta description, 140-160 chars. */
  description: string;
  category: ArticleCategory;
  tags: string[];
  readMinutes: number;
  /** ISO date, e.g. '2026-03-14'. */
  datePublished: string;
  dateModified?: string;
  icon: ArticleIcon;
  thumbnailUrl?: string;
  /** Featured guides appear in the homepage Guides block. */
  featured?: boolean;
  /** Markdown body. Supports MarkdownRenderer callouts (:::tip, :::prompt, :::warning, :::example). */
  body: string;
}
