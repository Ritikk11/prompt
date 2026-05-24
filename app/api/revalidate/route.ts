export const runtime = 'edge';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretFromParams = request.nextUrl.searchParams.get('secret');
    
    // Allow either Bearer token or ?secret= param for authorization
    const token = secretFromParams || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (token !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid revalidation token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const path = request.nextUrl.searchParams.get('path') || body.path;
    const tag = request.nextUrl.searchParams.get('tag') || body.tag;

    if (!path && !tag) {
      return NextResponse.json(
        { message: 'Missing path or tag parameter/body field' },
        { status: 400 }
      );
    }

    if (path) {
      revalidatePath(path);
    }
    
    if (tag) {
      revalidateTag(tag);
    }

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path,
      tag
    });
  } catch (err: any) {
    console.error('Revalidation error:', err);
    return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
  }
}
