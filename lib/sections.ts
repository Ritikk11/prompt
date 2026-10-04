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
  const tools = post.aiTools;
  if (tools) {
    for (let i = 0; i < tools.length; i++) {
      if (tools[i].toLowerCase() === target) return true;
    }
  }
  const images = post.images;
  if (images) {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.aiTool && img.aiTool.toLowerCase() === target) return true;
      if (img.aiTools) {
        for (let j = 0; j < img.aiTools.length; j++) {
          if (img.aiTools[j].toLowerCase() === target) return true;
        }
      }
    }
  }
  return false;
}

export function matchesCategory(post: Post, category?: string) {
  if (!category) return false;
  const target = category.toLowerCase();
  if (post.category && post.category.toLowerCase() === target) return true;
  const categories = post.categories;
  if (categories) {
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].toLowerCase() === target) return true;
    }
  }
  return false;
}

export function matchesTag(post: Post, tag?: string) {
  if (!tag) return false;
  const target = tag.toLowerCase();
  const tags = post.tags;
  if (tags) {
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].toLowerCase() === target) return true;
    }
  }
  return false;
}

export function filterPostsForSection(section: Section, posts: Post[], settings: SiteSettings, applyLimit = true) {
  const filtered: Post[] = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if ((post.status === 'published' || !post.status) && post.visibility !== 'private') {
      filtered.push(post);
    }
  }

  let matched: Post[] = filtered;

  switch (section.type) {
    case 'ai-tool': {
      const targetTool = section.aiTool?.trim().toLowerCase();
      if (!targetTool) return [];
      matched = filtered.filter((post) => matchesTool(post, targetTool));
      break;
    }
    case 'tag': {
      const targetTag = section.tag?.trim().toLowerCase();
      if (!targetTag) return [];
      matched = filtered.filter((post) => matchesTag(post, targetTag));
      break;
    }
    case 'category': {
      const targetCat = section.category?.trim().toLowerCase();
      if (!targetCat) return [];
      matched = filtered.filter((post) => matchesCategory(post, targetCat));
      break;
    }
    case 'latest':
      matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popular':
      matched.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case 'trending': {
      const viewsWeight = settings.features?.trendingViewsWeight ?? 1;
      const likesWeight = settings.features?.trendingLikesWeight ?? 2;
      matched.sort(
        (a, b) =>
          ((b.views || 0) * viewsWeight + (b.likes || 0) * likesWeight) -
          ((a.views || 0) * viewsWeight + (a.likes || 0) * likesWeight)
      );
      break;
    }
    case 'custom': {
      const idMap = new Map<string, Post>();
      for (let i = 0; i < filtered.length; i++) {
        idMap.set(filtered[i].id, filtered[i]);
      }
      matched = (section.postIds || [])
        .map((postId) => idMap.get(postId))
        .filter((post): post is Post => Boolean(post));
      break;
    }
  }

  return applyLimit && section.type !== 'latest' ? matched.slice(0, section.limit || 12) : matched;
}
