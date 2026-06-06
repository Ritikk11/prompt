import type { Post, Section, SiteSettings } from './types';

export function getSectionPath(section: Pick<Section, 'slug' | 'id'>) {
  return `/section/${section.slug || section.id}`;
}

export function getPostPath(post: Pick<Post, 'slug' | 'id'>) {
  return `/${post.slug || post.id}`;
}

export function matchesTool(post: Post, tool?: string) {
  if (!tool) return false;
  const target = tool.toLowerCase();
  return Boolean(
    post.aiTools?.some((item) => item.toLowerCase() === target) ||
    post.images?.some((image) =>
      image.aiTool?.toLowerCase() === target ||
      image.aiTools?.some((item) => item.toLowerCase() === target)
    )
  );
}

export function matchesCategory(post: Post, category?: string) {
  if (!category) return false;
  const target = category.toLowerCase();
  return Boolean(post.category?.toLowerCase() === target || post.categories?.some((item) => item.toLowerCase() === target));
}

export function matchesTag(post: Post, tag?: string) {
  if (!tag) return false;
  const target = tag.toLowerCase();
  return Boolean(post.tags?.some((item) => item.toLowerCase() === target));
}

export function filterPostsForSection(section: Section, posts: Post[], settings: SiteSettings, applyLimit = true) {
  let filtered = posts.filter((post) => (post.status === 'published' || !post.status) && post.visibility !== 'private');

  switch (section.type) {
    case 'ai-tool':
      filtered = filtered.filter((post) => matchesTool(post, section.aiTool));
      break;
    case 'tag':
      filtered = filtered.filter((post) => matchesTag(post, section.tag));
      break;
    case 'category':
      filtered = filtered.filter((post) => matchesCategory(post, section.category));
      break;
    case 'latest':
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popular':
      filtered = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case 'trending': {
      const viewsWeight = settings.features?.trendingViewsWeight ?? 1;
      const likesWeight = settings.features?.trendingLikesWeight ?? 2;
      filtered = [...filtered].sort(
        (a, b) =>
          ((b.views || 0) * viewsWeight + (b.likes || 0) * likesWeight) -
          ((a.views || 0) * viewsWeight + (a.likes || 0) * likesWeight)
      );
      break;
    }
    case 'custom':
      filtered = (section.postIds || [])
        .map((postId) => filtered.find((post) => post.id === postId))
        .filter((post): post is Post => Boolean(post));
      break;
  }

  return applyLimit && section.type !== 'latest' ? filtered.slice(0, section.limit || 12) : filtered;
}
