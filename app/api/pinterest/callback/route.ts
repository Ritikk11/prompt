import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  exchangePinterestCode,
  getPinterestUserAccount,
  getPinterestBoards,
  DEFAULT_PINTEREST_APP_ID,
  DEFAULT_PINTEREST_APP_SECRET,
  DEFAULT_PINTEREST_BOARD_ID,
  DEFAULT_PINTEREST_BOARD_NAME,
} from '@/lib/pinterest';
import type { SiteSettings, PinterestSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const adminBaseUrl = `${url.origin}/admin?tab=settings&subtab=pinterest`;

  if (error) {
    console.error('Pinterest OAuth denied or failed:', error, errorDescription);
    return NextResponse.redirect(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent('No authorization code received from Pinterest.')}`
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
      siteTitle: 'AI PromptMatrix',
      siteDescription: 'Prompt library',
      heroEnabled: true,
      heroAutoPlay: false,
      aiTools: [],
    };

    const currentPinterest = siteSettings.pinterestSettings || {};
    const appId = currentPinterest.appId || DEFAULT_PINTEREST_APP_ID;
    const appSecret = currentPinterest.appSecret || DEFAULT_PINTEREST_APP_SECRET;

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
      ...currentPinterest,
      appId,
      appSecret,
      boardId: targetBoard?.id || currentPinterest.boardId || DEFAULT_PINTEREST_BOARD_ID,
      boardName: targetBoard?.name || currentPinterest.boardName || DEFAULT_PINTEREST_BOARD_NAME,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || currentPinterest.refreshToken,
      tokenExpiresAt: Date.now() + tokens.expiresIn * 1000,
      username: userProfile?.username || currentPinterest.username || 'aipromptmatrix',
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
      return NextResponse.redirect(
        `${adminBaseUrl}&pinterest_error=${encodeURIComponent(upsertError.message)}`
      );
    }

    return NextResponse.redirect(`${adminBaseUrl}&pinterest=connected`);
  } catch (err: any) {
    console.error('Pinterest OAuth callback error:', err);
    return NextResponse.redirect(
      `${adminBaseUrl}&pinterest_error=${encodeURIComponent(err.message || 'OAuth token exchange failed')}`
    );
  }
}
