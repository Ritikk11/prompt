// Guarded server-side fetch for caller-supplied image URLs (Gemini routes).
// Without a host allowlist these routes were SSRF primitives: any admin could
// make the server request internal hosts (metadata endpoints, VPC IPs) and
// exfiltrate the response through the Gemini prompt.
const ALLOWED_HOSTS = new Set([
  'uploads.aipromptmatrix.in',
  'aipromptmatrix.in',
  'www.aipromptmatrix.in',
]);

function supabaseHost() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
}

export function isAllowedImageHost(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false; // no http, no file:, etc.
  const supa = supabaseHost();
  return ALLOWED_HOSTS.has(url.hostname) || (supa !== null && url.hostname === supa);
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export async function safeFetchImage(url: string): Promise<Response | null> {
  if (!isAllowedImageHost(url)) return null;
  try {
    // redirect: 'error' so an allowed host can't bounce the request to an
    // internal one after the allowlist check.
    return await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  } catch {
    return null;
  }
}

export { MAX_IMAGE_BYTES };
