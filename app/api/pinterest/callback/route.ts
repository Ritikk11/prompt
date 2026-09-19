import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import {
  exchangePinterestCode,
  getPinterestUserAccount,
  getPinterestBoards,
  DEFAULT_PINTEREST_APP_ID,
  DEFAULT_PINTEREST_BOARD_ID,
  DEFAULT_PINTEREST_BOARD_NAME,
} from '@/lib/pinterest';
import type { SiteSettings, PinterestSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

function redirectWithClearedState(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.set('pinterest_oauth_state', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/pinterest/callback',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const adminBaseUrl = `${url.origin}/admin?tab=settings&subtab=pinterest`;

  if (error) {
    console.error('Pinterest OAuth denied or failed:', error, errorDescription);
    return redirectWithClearedState(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return redirectWithClearedState(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent('No authorization code received from Pinterest.')}`
    );
  }

  const expectedState = request.cookies.get('pinterest_oauth_state')?.value || '';
  if (!state || !expectedState || state !== expectedState) {
    return redirectWithClearedState(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent('Pinterest authorization expired. Please start the connection again.')}`
    );
  }

  const auth = await requireAdmin(request);
  if (auth.error) {
    return redirectWithClearedState(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent('Please sign in as an administrator before connecting Pinterest.')}`
    );
  }

  try {
    const supabaseAdmin = createAdminClient();

    // Fetch existing settings to preserve configured app ID & secret if customized
    const { data: settingsRow } = await supabaseAdmin
      .from('settings')
      .select('data')
      .eq('id', 'global')
      .maybeSingle();

    const siteSettings: SiteSettings = settingsRow?.data || {
      siteTitle: 'PromptSoul',
      siteDescription: 'Prompt library',
      heroEnabled: true,
      heroAutoPlay: false,
      aiTools: [],
    };

    const currentPinterest = siteSettings.pinterestSettings || {};
    const { appSecret: _storedAppSecret, ...storedPinterest } = currentPinterest;
    const appId = currentPinterest.appId || DEFAULT_PINTEREST_APP_ID;
    const appSecret = currentPinterest.appSecret || process.env.PINTEREST_APP_SECRET;

    // Exchange the authorization code for tokens
    const tokens = await exchangePinterestCode(
      code,
      appId,
      appSecret,
      `${url.origin}/api/pinterest/callback`
    );

    // Fetch user account info to record the username and avatar
    const userProfile = await getPinterestUserAccount(tokens.accessToken);

    // Fetch boards to verify board ID or select default
    const boards = await getPinterestBoards(tokens.accessToken);
    const targetBoard = boards.find(b => b.id === (currentPinterest.boardId || DEFAULT_PINTEREST_BOARD_ID))
      || boards.find(b => b.name.toLowerCase() === DEFAULT_PINTEREST_BOARD_NAME.toLowerCase())
      || boards[0];

    const updatedPinterestSettings: PinterestSettings = {
      ...storedPinterest,
      appId,
      boardId: targetBoard?.id || currentPinterest.boardId || DEFAULT_PINTEREST_BOARD_ID,
      boardName: targetBoard?.name || currentPinterest.boardName || DEFAULT_PINTEREST_BOARD_NAME,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || currentPinterest.refreshToken,
      tokenExpiresAt: Date.now() + tokens.expiresIn * 1000,
      username: userProfile?.username || currentPinterest.username || 'promptsoul',
      scope: tokens.scope,
      isConnected: true,
      autoPublishNewPosts: currentPinterest.autoPublishNewPosts ?? true,
    };

    const { error: upsertError } = await supabaseAdmin.from('settings').upsert({
      id: 'global',
      data: {
        ...siteSettings,
        pinterestSettings: updatedPinterestSettings,
      },
    });

    if (upsertError) {
      console.error('Failed to save Pinterest settings in Supabase:', upsertError);
      return redirectWithClearedState(
        `${adminBaseUrl}&pinterest_error=${encodeURIComponent(upsertError.message)}`
      );
    }

    return redirectWithClearedState(`${adminBaseUrl}&pinterest=connected`);
  } catch (err: any) {
    console.error('Pinterest OAuth callback error:', err);
    return redirectWithClearedState(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent(err.message || 'OAuth token exchange failed')}`
    );
  }
}
