export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

function dataUrlToResponse(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;

  const [, contentType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function GET(_request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ message: 'Image service is not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('posts').select('data').eq('id', id).maybeSingle();

  if (error || !data?.data) {
    return NextResponse.json({ message: 'Image not found' }, { status: 404 });
  }

  const post = data.data;
  const imageUrl = post.thumbnailUrl?.startsWith('data:image')
    ? post.thumbnailUrl
    : post.images?.find((image: { url?: string }) => image.url?.startsWith('data:image'))?.url;

  if (!imageUrl) {
    return NextResponse.redirect(new URL('/placeholder-image.png', _request.url));
  }

  const response = dataUrlToResponse(imageUrl);
  return response || NextResponse.json({ message: 'Invalid image data' }, { status: 422 });
}
