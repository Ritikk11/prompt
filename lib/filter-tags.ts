import type { Post } from '@/lib/types';

export function getFilterTagsFromPosts(posts: Post[], limit = 12) {
  const counts = new Map<string, number>();
  posts.forEach(post => {
    (post.tags || []).forEach(tag => {
      const clean = tag.trim();
      if (!clean) return;
      counts.set(clean, (counts.get(clean) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}
