export interface IndexNowResponse {
  success: boolean;
  status?: number;
  message?: string;
  submittedCount?: number;
  key?: string;
}

const DEFAULT_KEY = 'f758ffa479794b339f86d7830b83ebfe';

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

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in').replace(/\/$/, '');
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

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      // 10s timeout so we never hang the server
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

    const errorText = await res.text().catch(() => '');
    console.warn(`[IndexNow] Submission returned status ${res.status}:`, errorText);
    return {
      success: false,
      status: res.status,
      message: `IndexNow API returned status ${res.status}: ${errorText || res.statusText}`,
      submittedCount: 0,
      key,
    };
  } catch (error: any) {
    console.warn('[IndexNow] Submission error:', error?.message || error);
    return {
      success: false,
      message: error?.message || 'Network error submitting to IndexNow',
      submittedCount: 0,
      key,
    };
  }
}
