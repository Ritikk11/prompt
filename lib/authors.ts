import type { Author, Post, SiteSettings } from './types';

export const DEFAULT_AUTHOR_ID = 'editorial-team';

export function slugifyAuthor(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || DEFAULT_AUTHOR_ID;
}

export function getDefaultAuthor(settings?: Partial<SiteSettings>): Author {
  const siteTitle = settings?.siteTitle || 'AI PromptMatrix';
  const now = new Date().toISOString();
  return {
    id: DEFAULT_AUTHOR_ID,
    slug: DEFAULT_AUTHOR_ID,
    name: `${siteTitle} Editorial Team`,
    role: 'Editorial Team',
    bio: `The ${siteTitle} editorial team reviews and organizes prompt collections so creators can find clear examples, model notes, and reusable AI image workflows.`,
    avatarUrl: settings?.siteLogo || '',
    website: process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in',
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeAuthor(author: Partial<Author>, fallback?: Author): Author {
  const name = author.name?.trim() || fallback?.name || 'Editorial Team';
  const id = author.id?.trim() || fallback?.id || slugifyAuthor(name);
  return {
    id,
    slug: author.slug?.trim() || slugifyAuthor(name || id),
    name,
    role: author.role?.trim() || fallback?.role || '',
    bio: author.bio?.trim() || fallback?.bio || '',
    avatarUrl: author.avatarUrl?.trim() || fallback?.avatarUrl || '',
    website: author.website?.trim() || fallback?.website || '',
    active: author.active ?? fallback?.active ?? true,
    createdAt: author.createdAt || fallback?.createdAt,
    updatedAt: author.updatedAt || fallback?.updatedAt,
  };
}

export function getAuthors(settings?: Partial<SiteSettings>): Author[] {
  const fallback = getDefaultAuthor(settings);
  const authors = (settings?.authors || [])
    .map(author => normalizeAuthor(author, fallback))
    .filter(author => author.name.trim());

  if (!authors.some(author => author.id === fallback.id || author.slug === fallback.slug)) {
    authors.unshift(fallback);
  }

  return authors;
}

export function getVisibleAuthors(settings?: Partial<SiteSettings>) {
  return getAuthors(settings).filter(author => author.active !== false);
}

export function getAuthorForPost(post: Pick<Post, 'authorId'>, settings?: Partial<SiteSettings>): Author {
  const authors = getAuthors(settings);
  const defaultId = settings?.defaultAuthorId || DEFAULT_AUTHOR_ID;
  return (
    authors.find(author => author.id === post.authorId) ||
    authors.find(author => author.slug === post.authorId) ||
    authors.find(author => author.id === defaultId) ||
    authors[0] ||
    getDefaultAuthor(settings)
  );
}
