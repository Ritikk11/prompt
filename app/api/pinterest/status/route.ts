import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getPinterestAuthUrl,
  getValidPinterestAccessToken,
  getPinterestBoards,
  DEFAULT_PINTEREST_APP_ID,
  DEFAULT_PINTEREST_BOARD_ID,
  DEFAULT_PINTEREST_BOARD_NAME,
} from '@/lib/pinterest';
import type { SiteSettings, PinterestSettings, Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const admin = auth.admin!;

  try {
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/pinterest/callback`;

    // Fetch settings and posts in parallel
    const [settingsRes, postsRes] = await Promise.all([
      admin.from('settings').select('data').eq('id', 'global').maybeSingle(),
      admin.from('posts').select('data'),
    ]);

    const siteSettings: SiteSettings = settingsRes.data?.data || {};
    const pSettings: PinterestSettings = siteSettings.pinterestSettings || {};

    const posts: Post[] = (postsRes.data || []).map((r: any) => r.data).filter(Boolean);
    const publishedPosts = posts.filter(p => p.status === 'published');
    const pinnedPosts = publishedPosts.filter(p => !!p.pinterestPinId);
    const unpinnedPosts = publishedPosts.filter(p => !p.pinterestPinId);

    const appId = pSettings.appId || DEFAULT_PINTEREST_APP_ID;
    const oauthState = crypto.randomUUID();
    const authUrl = getPinterestAuthUrl(appId, redirectUri, oauthState);

    let isConnected = false;
    let boards: Array<{ id: string; name: string; privacy?: string }> = [];
    let connectionError: string | null = null;

    if (pSettings.accessToken || pSettings.refreshToken) {
      try {
        const { accessToken } = await getValidPinterestAccessToken(admin);
        isConnected = true;
        boards = await getPinterestBoards(accessToken);
      } catch (err: any) {
        connectionError = err.message;
        isConnected = false;
      }
    }

    const response = NextResponse.json({
      connected: isConnected,
      username: pSettings.username || 'promptsoul',
      appId,
      boardId: pSettings.boardId || DEFAULT_PINTEREST_BOARD_ID,
      boardName: pSettings.boardName || DEFAULT_PINTEREST_BOARD_NAME,
      autoPublishNewPosts: pSettings.autoPublishNewPosts ?? true,
      lastPublishedAt: pSettings.lastPublishedAt || null,
      authUrl,
      boards,
      stats: {
        totalPublished: publishedPosts.length,
        pinnedCount: pinnedPosts.length,
        unpinnedCount: unpinnedPosts.length,
      },
      connectionError,
    });
    response.cookies.set('pinterest_oauth_state', oauthState, {
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      path: '/api/pinterest/callback',
      maxAge: 10 * 60,
    });
    return response;
  } catch (err: any) {
    console.error('Pinterest status error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to check Pinterest status' },
      { status: 500 }
    );
  }
}
