import { createClient } from '@/lib/supabase-client';

export type UploadProvider = 'supabase' | 'cloudflare';
export type UploadPreset = 'prompt' | 'thumbnail' | 'reference' | 'avatar' | 'logo' | 'aistudio';

function extFor(file: File) {
  return file.name.split('.').pop() || 'webp';
}

function randomName() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function uploadImageFileToProvider(
  file: File,
  provider: UploadProvider = 'supabase',
  preset: UploadPreset = 'prompt'
) {
  if (provider === 'cloudflare') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preset', preset);

    // Send the Supabase access token as a Bearer header. Session cookies do not
    // reliably reach server routes in the OpenNext/Cloudflare deployment, so the
    // upload route authenticates via this header first (same pattern as /api/admin).
    const supabase = createClient();
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      const refreshed = await supabase.auth
        .refreshSession()
        .catch(() => ({ data: { session: null } as { session: null } }));
      session = refreshed.data.session;
    }
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Cloudflare upload failed');
    }
    return String(data.url);
  }

  const supabase = createClient();
  const fileName = `${preset}s/${randomName()}.${extFor(file)}`;
  const { error } = await supabase.storage.from('images').upload(fileName, file, {
    contentType: file.type || 'image/webp',
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
  return publicUrl;
}
