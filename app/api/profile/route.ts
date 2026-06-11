import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Post } from '@/lib/types';

async function getUserFromRequest(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const admin = createAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function sanitizeProfilePost(post: Post, userId: string): Post {
  const isPublic = (post.status === 'published' || !post.status) && post.visibility !== 'private';
  return {
    ...post,
    images: isPublic ? post.images : post.images.map((image) => ({ ...image, prompt: image.prompt || '' })),
    likedByUser: false,
    bookmarkedByUser: post.bookmarkedBy?.includes(userId) || false,
    bookmarkedBy: undefined,
  };
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('posts').select('data');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = (data || []).map((row: any) => row.data as Post).filter(Boolean);
  const bookmarks = posts
    .filter((post) => post.bookmarkedBy?.includes(user.id))
    .filter((post) => (post.status === 'published' || !post.status) && post.visibility !== 'private')
    .map((post) => sanitizeProfilePost(post, user.id));

  const submissions = posts
    .filter((post) => post.authorId === user.id)
    .map((post) => sanitizeProfilePost(post, user.id));

  return NextResponse.json({ bookmarks, submissions });
}
