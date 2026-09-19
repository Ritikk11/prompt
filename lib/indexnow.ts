export interface IndexNowResponse {
  success: boolean;
  status?: number;
  message?: string;
  submittedCount?: number;
  key?: string;
}

const DEFAULT_KEY = 'd2725a72cddd4faba71fcc50a0d414cc';

/**
 * Submits one or more URLs to the IndexNow API (notifying Bing, Yandex, Naver, Seznam, etc.)
 */
export async function submitToIndexNow(
  urls: string | string[],
  customKey?: string,
  customHost?: string
): Promise<IndexNowResponse> {
  const rawList = Array.isArray(urls) ? urls : [urls];
  const urlList = Array.from(new Set(rawList.map(u => u?.trim()).filter(Boolean)));

  if (urlList.length === 0) {
    return { success: false, message: 'No URLs provided for submission' };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in').replace(/\/$/, '');
  const host = customHost || new URL(siteUrl).host;
  const key = (customKey || process.env.INDEXNOW_KEY || DEFAULT_KEY).trim();
  const keyLocation = `${siteUrl}/${key}.txt`;

  // Ensure all submitted URLs are absolute URLs on the host
  const absoluteUrlList = urlList.map(u => {
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `${siteUrl}${u.startsWith('/') ? '' : '/'}${u}`;
  });

  const payload = {
    host,
    key,
    keyLocation,
    urlList: absoluteUrlList,
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
    'https://search.seznam.cz/indexnow',
  ];

  let lastStatus = 500;
  let lastErrorText = '';

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'PromptSoul-IndexNow/1.0 (+https://promptsoul.in)',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      // 200 = OK, 202 = Accepted (valid IndexNow responses)
      if (res.ok || res.status === 200 || res.status === 202) {
        return {
          success: true,
          status: res.status,
          message: `Successfully submitted ${absoluteUrlList.length} URL(s) to IndexNow`,
          submittedCount: absoluteUrlList.length,
          key,
        };
      }

      lastStatus = res.status;
      lastErrorText = await res.text().catch(() => '');
      console.warn(`[IndexNow] ${endpoint} returned status ${res.status}:`, lastErrorText);

      // If rate-limited (429) or server error (5xx), try alternate endpoint
      if (res.status === 429 || res.status >= 500) {
        continue;
      } else {
        break;
      }
    } catch (err: any) {
      console.warn(`[IndexNow] Error connecting to ${endpoint}:`, err?.message || err);
      lastErrorText = err?.message || 'Network error';
    }
  }

  const isRateLimited = lastStatus === 429 || lastErrorText.includes('TooManyRequests');
  const friendlyMessage = isRateLimited
    ? 'IndexNow temporary rate limit reached (too many rapid requests). Please wait 2–3 minutes before pinging again.'
    : `IndexNow API returned status ${lastStatus}: ${lastErrorText}`;

  return {
    success: false,
    status: lastStatus,
    message: friendlyMessage,
    submittedCount: 0,
    key,
  };
}
