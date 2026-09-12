import { notFound, permanentRedirect } from 'next/navigation';
import { isSafePublicSlug } from '@/lib/slug-guard';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SeoPublicPage({ params }: Props) {
  const { slug } = await params;
  // Permanently 308/301 redirect legacy /page/[slug] to canonical /[slug]
  const cleanSlug = String(slug || '').replace(/^\/+|\/+$/g, '');
  if (!isSafePublicSlug(cleanSlug)) notFound();
  permanentRedirect(`/${cleanSlug}`);
}
