import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type NewsletterSubscriber = {
  email: string;
  status: 'subscribed';
  source: string;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
};

const NEWSLETTER_SETTINGS_ID = 'newsletter_subscribers';
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
    const { data: existingRow, error: readError } = await supabase
      .from('settings')
      .select('data')
      .eq('id', NEWSLETTER_SETTINGS_ID)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: 'Could not load subscriber storage.' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const currentData = existingRow?.data && typeof existingRow.data === 'object' ? existingRow.data as { subscribers?: NewsletterSubscriber[] } : {};
    const subscribers = Array.isArray(currentData.subscribers) ? currentData.subscribers : [];
    const existingIndex = subscribers.findIndex(subscriber => subscriber.email.toLowerCase() === email);
    const existingSubscriber = existingIndex >= 0 ? subscribers[existingIndex] : undefined;
    const nextSubscriber: NewsletterSubscriber = {
      email,
      status: 'subscribed',
      source: existingSubscriber?.source || 'homepage',
      consentAt: existingSubscriber?.consentAt || now,
      createdAt: existingSubscriber?.createdAt || now,
      updatedAt: now,
    };
    const nextSubscribers = existingIndex >= 0
      ? subscribers.map((subscriber, index) => index === existingIndex ? nextSubscriber : subscriber)
      : [nextSubscriber, ...subscribers].slice(0, 5000);

    const { error: writeError } = await supabase
      .from('settings')
      .upsert({
        id: NEWSLETTER_SETTINGS_ID,
        data: {
          subscribers: nextSubscribers,
          updatedAt: now,
        },
      });

    if (writeError) {
      return NextResponse.json({ error: 'Could not save subscriber.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Newsletter subscription failed', error);
    return NextResponse.json({ error: 'Could not subscribe right now.' }, { status: 500 });
  }
}
