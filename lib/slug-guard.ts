const SENSITIVE_FILE_NAMES = new Set([
  '.env',
  '.env.local',
  '.git',
  'config.py',
  'firebase-service-account.json',
  'service-account.json',
  'wp-config.php',
]);

export function isSafePublicSlug(value: string) {
  if (!value || value.length > 160) return false;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }

  const slug = decoded.trim().toLowerCase();
  if (!slug || slug !== decoded || slug.startsWith('.') || slug.includes('..')) return false;
  if (slug.includes('/') || slug.includes('\\') || slug.includes('%')) return false;
  if (slug.includes('.') || SENSITIVE_FILE_NAMES.has(slug)) return false;

  return /^[a-z0-9][a-z0-9_-]{0,159}$/.test(slug);
}
