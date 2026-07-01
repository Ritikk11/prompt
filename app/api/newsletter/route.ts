import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email,
        status: 'subscribed',
        source: 'homepage',
        consent_at: now,
        updated_at: now,
      }, { onConflict: 'email' });

    if (error) {
      console.error('Newsletter subscription failed', error);
      return NextResponse.json({ error: 'Could not save subscriber.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Newsletter subscription failed', error);
    return NextResponse.json({ error: 'Could not subscribe right now.' }, { status: 500 });
  }
}
