import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptgallery.com';

  try {
    // 1. Fetch site settings for title and description
    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    const settings = settingsDoc.exists() ? (settingsDoc.data() as SiteSettings) : null;
    const siteTitle = settings?.siteTitle || 'PromptVault';
    const siteDescription = settings?.siteDescription || 'Curated AI Prompts';

    // 2. Fetch posts
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    const posts = snapshot.docs.map(d => d.data() as Post);
    const publishedPosts = posts.filter(p => p.status === 'published' || !p.status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50); // only last 50 for RSS

    // 3. Construct XML
    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />`;

    publishedPosts.forEach(post => {
      const url = `${baseUrl}/post/${post.slug || post.id}`;
      // Safe description XML encode
      const desc = (post.description || post.title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const htmlTitle = post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      rss += `
    <item>
      <title>${htmlTitle}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${desc}</description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    </item>`;
    });

    rss += `
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error: any) {
    if (error?.name !== 'AbortError' && !error?.message?.includes('aborted') && !String(error).includes('aborted')) {
      console.error("RSS feed error:", error);
    }
    return new NextResponse('<rss version="2.0"><channel><title>Error</title></channel></rss>', {
      headers: { 'Content-Type': 'application/xml' },
      status: 500
    });
  }
}
