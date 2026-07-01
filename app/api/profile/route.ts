import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Post } from '@/lib/types';

function isMissingTableError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
  return code === '42P01' || message.includes('Could not find the table') || message.includes('does not exist');
}

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
    likedByUser: post.likedBy?.includes(userId) || false,
    likedBy: undefined,
    bookmarkedByUser: post.bookmarkedBy?.includes(userId) || false,
    bookmarkedBy: undefined,
  };
}

function isPublicPost(post: Pick<Post, 'status' | 'visibility'>) {
  return (post.status === 'published' || !post.status) && post.visibility !== 'private';
}

function postsFromRows(rows: any[] | null | undefined) {
  return (rows || []).map((row: any) => row.data as Post).filter(Boolean);
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const [bookmarkRows, likeRows, submissionRows, commentRows, legacySubmissionRows, legacyBookmarkRows, legacyLikeRows, legacyCommentRows] = await Promise.all([
    admin.from('user_bookmarks').select('post_id, created_at').eq('user_id', user.id),
    admin.from('user_likes').select('post_id, created_at').eq('user_id', user.id),
    admin.from('submissions').select('id, data, status, created_at, updated_at').eq('user_id', user.id),
    admin.from('comments').select('id, post_id, text, status, created_at').eq('user_id', user.id),
    admin.from('posts').select('data').eq('data->>authorId', user.id),
    admin
      .from('posts')
      .select('data')
      .eq('data->>status', 'published')
      .filter('data->bookmarkedBy', 'cs', JSON.stringify([user.id])),
    admin
      .from('posts')
      .select('data')
      .eq('data->>status', 'published')
      .filter('data->likedBy', 'cs', JSON.stringify([user.id])),
    admin
      .from('posts')
      .select('data')
      .filter('data->comments', 'cs', JSON.stringify([{ userId: user.id }])),
  ]);

  for (const result of [bookmarkRows, likeRows, submissionRows, commentRows]) {
    if (result.error && !isMissingTableError(result.error)) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }
  for (const result of [legacySubmissionRows, legacyBookmarkRows, legacyLikeRows, legacyCommentRows]) {
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }

  const bookmarkIds = new Set((bookmarkRows.data || []).map((row: any) => row.post_id));
  const likeIds = new Set((likeRows.data || []).map((row: any) => row.post_id));
  const commentPostIds = new Set((commentRows.data || []).map((row: any) => row.post_id));
  const normalizedPostIds = Array.from(new Set([...bookmarkIds, ...likeIds, ...commentPostIds]));
  const normalizedPostRows = normalizedPostIds.length > 0
    ? await admin.from('posts').select('id, data').in('id', normalizedPostIds)
    : { data: [], error: null };

  if (normalizedPostRows.error) {
    return NextResponse.json({ error: normalizedPostRows.error.message }, { status: 500 });
  }

  const normalizedPostMap = new Map(
    (normalizedPostRows.data || [])
      .map((row: any) => [row.id, row.data as Post] as const)
      .filter(([, post]) => Boolean(post))
  );

  const tableBookmarkPosts = Array.from(bookmarkIds)
    .map((id) => normalizedPostMap.get(id))
    .filter((post): post is Post => Boolean(post))
    .filter(isPublicPost);
  const legacyBookmarkPosts = postsFromRows(legacyBookmarkRows.data)
    .filter(isPublicPost)
    .filter((post) => !bookmarkIds.has(post.id));

  const bookmarks = [...tableBookmarkPosts, ...legacyBookmarkPosts]
    .map((post) => sanitizeProfilePost(post, user.id));

  const tableLikedPosts = Array.from(likeIds)
    .map((id) => normalizedPostMap.get(id))
    .filter((post): post is Post => Boolean(post))
    .filter(isPublicPost);
  const legacyLikedPosts = postsFromRows(legacyLikeRows.data)
    .filter(isPublicPost)
    .filter((post) => !likeIds.has(post.id));

  const liked = [...tableLikedPosts, ...legacyLikedPosts]
    .map((post) => sanitizeProfilePost(post, user.id));

  const tableSubmissions = (submissionRows.data || [])
    .map((row: any) => ({ ...(row.data as Post), status: row.status || row.data?.status, createdAt: row.data?.createdAt || row.created_at }))
    .filter(Boolean)
    .map((post: Post) => sanitizeProfilePost(post, user.id));
  const legacySubmissions = postsFromRows(legacySubmissionRows.data)
    .filter((post) => !tableSubmissions.some((submission) => submission.id === post.id))
    .map((post) => sanitizeProfilePost(post, user.id));
  const submissions = [...tableSubmissions, ...legacySubmissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tableComments = (commentRows.data || [])
    .map((comment: any) => {
      const post = normalizedPostMap.get(comment.post_id);
      return {
        id: comment.id,
        postId: comment.post_id,
        postTitle: post?.title || 'Prompt',
        postSlug: post?.slug || comment.post_id,
        text: comment.text,
        status: comment.status,
        createdAt: comment.created_at,
      };
    });
  const legacyComments = postsFromRows(legacyCommentRows.data)
    .flatMap((post) => (post.comments || [])
      .filter((comment) => comment.userId === user.id)
      .filter((comment) => !tableComments.some((item) => item.id === comment.id))
      .map((comment) => ({
        id: comment.id,
        postId: post.id,
        postTitle: post.title,
        postSlug: post.slug,
        text: comment.text,
        status: comment.status,
        createdAt: comment.createdAt,
      })));
  const comments = [...tableComments, ...legacyComments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const viewerStateIds = new Set([
    ...Array.from(bookmarkIds),
    ...Array.from(likeIds),
    ...legacyBookmarkPosts.map((post) => post.id),
    ...legacyLikedPosts.map((post) => post.id),
  ]);
  const viewerState = Array.from(viewerStateIds).map((id) => ({
    id,
    bookmarkedByUser: bookmarkIds.has(id) || legacyBookmarkPosts.some((post) => post.id === id),
    likedByUser: likeIds.has(id) || legacyLikedPosts.some((post) => post.id === id),
  }));

  return NextResponse.json({ bookmarks, liked, submissions, comments, viewerState });
}
