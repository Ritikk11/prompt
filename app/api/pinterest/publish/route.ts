import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { publishPostToPinterest, publishAllUnpinnedPosts } from '@/lib/pinterest';
import type { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const admin = auth.admin!;

  try {
    const body = await request.json().catch(() => ({}));
    const { postId, all, boardId } = body || {};

    if (all) {
      const summary = await publishAllUnpinnedPosts(admin);
      return NextResponse.json({
        ok: true,
        summary,
      });
    }

    if (!postId) {
      return NextResponse.json(
        { error: 'Missing postId or all parameter' },
        { status: 400 }
      );
    }

    // Fetch the single post
    const { data: postRow, error: postError } = await admin
      .from('posts')
      .select('data')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !postRow?.data) {
      return NextResponse.json(
        { error: `Post with ID "${postId}" not found.` },
        { status: 404 }
      );
    }

    const post: Post = postRow.data;
    const result = await publishPostToPinterest(post, admin, boardId);

    return NextResponse.json({
      ok: true,
      pinId: result.pinId,
      pinUrl: result.pinUrl,
      post: result.post,
    });
  } catch (err: any) {
    console.error('Pinterest publish error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to publish to Pinterest' },
      { status: 500 }
    );
  }
}
