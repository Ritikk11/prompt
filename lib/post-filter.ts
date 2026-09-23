import type { Post } from './types';

/**
 * Pure check to determine if a post is visible to public visitors.
 * Kept standalone with zero database/Supabase dependencies so client components
 * can import it without accidentally pulling the server data layer into their bundle.
 */
export function isPublicPost(post: Pick<Post, 'status' | 'visibility'>) {
  return (post.status === 'published' || !post.status) && post.visibility !== 'private';
}
