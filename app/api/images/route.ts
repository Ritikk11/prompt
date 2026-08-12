import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getRequestUser, isCurrentUserAdmin } from '@/lib/admin-auth';

type R2Object = {
  key: string;
  uploaded: Date;
  size: number;
};

type R2Objects = {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
};

type R2ListOptions = {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
};

type R2BucketLike = {
  list: (options?: R2ListOptions) => Promise<R2Objects>;
};

async function getUploadsBucket() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // @ts-ignore
    const maybeEnv = env as { UPLOADS?: R2BucketLike };
    return maybeEnv.UPLOADS || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { data: { user } } = await getRequestUser(request);
  if (!user || !(await isCurrentUserAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const prefix = searchParams.get('prefix') || undefined;
  const delimiter = '/';

  const bucket = await getUploadsBucket();
  if (!bucket) {
    return NextResponse.json(
      { error: 'Cloudflare R2 uploads are not configured for this environment.' },
      { status: 503 }
    );
  }

  try {
    const listed = await bucket.list({ limit, cursor, prefix, delimiter });
    
    const publicBaseUrl = (process.env.CLOUDFLARE_UPLOAD_PUBLIC_URL || 'https://uploads.aipromptmatrix.in').replace(/\/$/, '');
    
    // Sort descending by uploaded date
    const sortedObjects = [...listed.objects].sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

    const images = sortedObjects.map(obj => ({
      key: obj.key,
      url: `${publicBaseUrl}/${obj.key}`,
      uploaded: obj.uploaded,
      size: obj.size
    }));

    return NextResponse.json({
      images,
      folders: listed.delimitedPrefixes || [],
      truncated: listed.truncated,
      cursor: listed.cursor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
