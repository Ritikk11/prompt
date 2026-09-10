import type { Post, SiteSettings, PinterestSettings } from './types';

export const DEFAULT_PINTEREST_APP_ID = '1610432';
export const DEFAULT_PINTEREST_APP_SECRET = 'c14f464099e8ac7a703b452d947adc2b55f99d5e';
export const DEFAULT_PINTEREST_BOARD_ID = '1124703775633314110';
export const DEFAULT_PINTEREST_BOARD_NAME = 'Ai Image Prompts';
export const DEFAULT_PINTEREST_REDIRECT_URI = 'https://aipromptmatrix.in/api/pinterest/callback';
export const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
export const PINTEREST_SCOPES = [
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
  'user_accounts:read'
].join(',');

/**
 * Builds the Pinterest OAuth 2.0 authorization URL
 */
export function getPinterestAuthUrl(
  clientId = DEFAULT_PINTEREST_APP_ID,
  redirectUri = DEFAULT_PINTEREST_REDIRECT_URI
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: PINTEREST_SCOPES,
  });
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

/**
 * Exchanges authorization code for an OAuth access token and refresh token
 */
export async function exchangePinterestCode(
  code: string,
  clientId = DEFAULT_PINTEREST_APP_ID,
  clientSecret = DEFAULT_PINTEREST_APP_SECRET,
  redirectUri = DEFAULT_PINTEREST_REDIRECT_URI
) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error_description || json.error || `Token exchange failed with status ${res.status}`);
  }

  return {
    accessToken: json.access_token as string,
    refreshToken: (json.refresh_token || '') as string,
    expiresIn: (json.expires_in || 2592000) as number,
    scope: (json.scope || '') as string,
  };
}

/**
 * Refreshes an expired Pinterest access token using the refresh token
 */
export async function refreshPinterestToken(
  refreshToken: string,
  clientId = DEFAULT_PINTEREST_APP_ID,
  clientSecret = DEFAULT_PINTEREST_APP_SECRET
) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error_description || json.error || `Token refresh failed with status ${res.status}`);
  }

  return {
    accessToken: json.access_token as string,
    refreshToken: (json.refresh_token || refreshToken) as string,
    expiresIn: (json.expires_in || 2592000) as number,
    scope: (json.scope || '') as string,
  };
}

/**
 * Fetches authenticated Pinterest user details
 */
export async function getPinterestUserAccount(accessToken: string) {
  const res = await fetch(`${PINTEREST_API_BASE}/user_account`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch Pinterest user account:', errorText);
    return null;
  }

  return res.json();
}

/**
 * Fetches all Pinterest boards belonging to the user
 */
export async function getPinterestBoards(accessToken: string) {
  const res = await fetch(`${PINTEREST_API_BASE}/boards`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch Pinterest boards:', errorText);
    return [];
  }

  const json = await res.json();
  return (json.items || []) as Array<{ id: string; name: string; privacy?: string }>;
}

/**
 * Gets a valid access token from Supabase settings, auto-refreshing if expired
 */
export async function getValidPinterestAccessToken(supabaseAdmin: any): Promise<{
  accessToken: string;
  boardId: string;
  settings: PinterestSettings;
}> {
  const { data: row, error } = await supabaseAdmin
    .from('settings')
    .select('data')
    .eq('id', 'global')
    .maybeSingle();

  if (error || !row?.data) {
    throw new Error('Failed to load site settings from Supabase.');
  }

  const siteSettings: SiteSettings = row.data;
  const pSettings: PinterestSettings = siteSettings.pinterestSettings || {};

  const appId = pSettings.appId || DEFAULT_PINTEREST_APP_ID;
  const appSecret = pSettings.appSecret || DEFAULT_PINTEREST_APP_SECRET;
  const boardId = pSettings.boardId || DEFAULT_PINTEREST_BOARD_ID;

  if (!pSettings.accessToken && !pSettings.refreshToken) {
    throw new Error('Pinterest is not connected. Please connect your account in Settings.');
  }

  const now = Date.now();
  const tokenExpiredOrExpiring = !pSettings.accessToken || (pSettings.tokenExpiresAt && pSettings.tokenExpiresAt < now + 5 * 60 * 1000);

  if (tokenExpiredOrExpiring && pSettings.refreshToken) {
    try {
      const refreshed = await refreshPinterestToken(pSettings.refreshToken, appId, appSecret);
      const updatedPinterestSettings: PinterestSettings = {
        ...pSettings,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        tokenExpiresAt: now + refreshed.expiresIn * 1000,
        isConnected: true,
      };

      await supabaseAdmin.from('settings').upsert({
        id: 'global',
        data: {
          ...siteSettings,
          pinterestSettings: updatedPinterestSettings,
        },
      });

      return {
        accessToken: refreshed.accessToken,
        boardId,
        settings: updatedPinterestSettings,
      };
    } catch (refreshErr: any) {
      console.error('Pinterest token refresh failed:', refreshErr);
      throw new Error(`Pinterest token refresh failed: ${refreshErr.message}. Please reconnect in Settings.`);
    }
  }

  if (!pSettings.accessToken) {
    throw new Error('No valid Pinterest access token found. Please reconnect in Settings.');
  }

  return {
    accessToken: pSettings.accessToken,
    boardId,
    settings: pSettings,
  };
}

/**
 * Resolves the primary direct image URL for a post to be accepted by Pinterest
 */
export function resolveDirectImageUrl(post: Post): string {
  const candidate = post.thumbnailUrl || post.images?.[0]?.url || (post.images?.[0]?.urls && post.images[0].urls[0]) || '';
  if (!candidate) return '';

  let url = candidate.trim();

  // Strip Cloudflare resize wrapper if present (/cdn-cgi/image/...)
  const cgiMatch = url.match(/\/cdn-cgi\/image\/[^/]+\/(https?:\/\/.+)/);
  if (cgiMatch && cgiMatch[1]) {
    url = cgiMatch[1];
  }

  // Handle protocol-relative
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Handle relative or bare R2 filenames
  if (url.startsWith('/')) {
    return `https://uploads.aipromptmatrix.in${url}`;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://uploads.aipromptmatrix.in/${url}`;
  }

  return url;
}

/**
 * Formats a clean Pinterest title (max 100 chars)
 */
export function formatPinterestTitle(post: Post): string {
  let title = (post.title || post.images?.[0]?.prompt || 'AI Image Prompt').trim();
  // Remove markdown or quotes
  title = title.replace(/^["']|["']$/g, '').trim();
  if (title.length > 100) {
    title = title.slice(0, 97) + '...';
  }
  return title;
}

/**
 * Formats a Pinterest description (max 800 chars) with prompt details, hashtags, and model
 */
export function formatPinterestDescription(post: Post): string {
  const parts: string[] = [];

  const mainDesc = post.description?.trim();
  if (mainDesc) {
    parts.push(mainDesc);
  }

  const primaryPrompt = post.images?.[0]?.prompt?.trim();
  if (primaryPrompt && primaryPrompt !== mainDesc) {
    parts.push(`Prompt: ${primaryPrompt}`);
  }

  const tool = post.images?.[0]?.aiTool || post.aiTools?.[0] || 'AI';
  const model = post.images?.[0]?.model;
  parts.push(model ? `Generated with: ${tool} (${model})` : `Generated with: ${tool}`);

  if (post.tags && post.tags.length > 0) {
    const hashtags = post.tags
      .slice(0, 7)
      .map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`)
      .filter(t => t.length > 1)
      .join(' ');
    if (hashtags) parts.push(hashtags);
  }

  parts.push('Explore more copy-ready AI image prompts at AI PromptMatrix.');

  let desc = parts.join('\n\n');
  if (desc.length > 800) {
    desc = desc.slice(0, 797) + '...';
  }
  return desc;
}

/**
 * Creates a Pin on Pinterest via Pinterest API v5
 */
export async function createPinterestPin(options: {
  accessToken: string;
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  altText?: string;
}) {
  const { accessToken, boardId, title, description, link, imageUrl, altText } = options;

  if (!imageUrl) {
    throw new Error('Image URL is required to publish a pin.');
  }

  const payload = {
    board_id: boardId,
    title,
    description,
    link,
    alt_text: (altText || title).slice(0, 500),
    media_source: {
      source_type: 'image_url',
      url: imageUrl,
    },
  };

  const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.message || json.error || (json.details ? JSON.stringify(json.details) : `Pinterest API error (${res.status})`);
    throw new Error(msg);
  }

  return {
    id: json.id as string,
    link: `https://www.pinterest.com/pin/${json.id}/`,
    createdAt: json.created_at as string,
    title: json.title as string,
  };
}

/**
 * Publishes a single post to Pinterest and saves the pin reference back to Supabase
 */
export async function publishPostToPinterest(
  post: Post,
  supabaseAdmin: any,
  overrideBoardId?: string
) {
  const { accessToken, boardId } = await getValidPinterestAccessToken(supabaseAdmin);
  const targetBoardId = overrideBoardId || boardId;

  const imageUrl = resolveDirectImageUrl(post);
  if (!imageUrl) {
    throw new Error(`Post "${post.title}" has no valid image URL.`);
  }

  const title = formatPinterestTitle(post);
  const description = formatPinterestDescription(post);
  const link = `https://aipromptmatrix.in/${post.slug || post.id}`;

  const pin = await createPinterestPin({
    accessToken,
    boardId: targetBoardId,
    title,
    description,
    link,
    imageUrl,
    altText: title,
  });

  // Update post in Supabase
  const updatedPost: Post = {
    ...post,
    pinterestPinId: pin.id,
    pinterestPinnedAt: new Date().toISOString(),
    pinterestUrl: pin.link,
  };

  await supabaseAdmin.from('posts').upsert({
    id: post.id,
    data: updatedPost,
  });

  // Update lastPublishedAt in settings
  const { data: settingsRow } = await supabaseAdmin
    .from('settings')
    .select('data')
    .eq('id', 'global')
    .maybeSingle();

  if (settingsRow?.data) {
    await supabaseAdmin.from('settings').upsert({
      id: 'global',
      data: {
        ...settingsRow.data,
        pinterestSettings: {
          ...settingsRow.data.pinterestSettings,
          lastPublishedAt: new Date().toISOString(),
        },
      },
    });
  }

  return {
    ok: true,
    pinId: pin.id,
    pinUrl: pin.link,
    post: updatedPost,
  };
}

/**
 * Publishes all unpinned published posts to Pinterest sequentially
 */
export async function publishAllUnpinnedPosts(supabaseAdmin: any) {
  const { data: postRows, error } = await supabaseAdmin.from('posts').select('data');
  if (error || !postRows) {
    throw new Error('Failed to fetch posts from database.');
  }

  const posts: Post[] = postRows.map((r: any) => r.data).filter(Boolean);
  const eligiblePosts = posts.filter(p => p.status === 'published' && !p.pinterestPinId);

  const results: Array<{ id: string; title: string; pinUrl?: string; error?: string }> = [];

  for (const post of eligiblePosts) {
    try {
      const res = await publishPostToPinterest(post, supabaseAdmin);
      results.push({ id: post.id, title: post.title, pinUrl: res.pinUrl });
      // Small pause to respect Pinterest API limits
      await new Promise(r => setTimeout(r, 600));
    } catch (err: any) {
      results.push({ id: post.id, title: post.title, error: err.message });
    }
  }

  return {
    totalEligible: eligiblePosts.length,
    successfulCount: results.filter(r => !r.error).length,
    results,
  };
}
