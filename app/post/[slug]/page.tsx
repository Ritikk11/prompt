import { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import PostContent from './PostContent';
import type { Post } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPostBySlugOrId(identifier: string): Promise<Post | null> {
  try {
    // Try slug first
    const q = query(
      collection(db, 'posts'),
      where('slug', '==', identifier),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data() as Post;
      return { ...data, id: querySnapshot.docs[0].id };
    }

    // Try ID fallback
    const docSnap = await getDoc(doc(db, 'posts', identifier));
    if (docSnap.exists()) {
      return { ...docSnap.data() as Post, id: docSnap.id };
    }
  } catch (error) {
    console.error('Error fetching post for metadata:', error);
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugOrId(slug);

  if (!post) {
    return {
      title: 'Post Not Found | PromptVault',
      description: 'The requested AI prompt could not be found.',
    };
  }

  const firstImageUrl = post.images[0]?.url || '';
  const isBase64 = firstImageUrl.startsWith('data:');

  const metaTitle = post.seoTitle || `${post.title} | AI Prompts - PromptVault`;
  const metaDescription = post.seoDescription || post.description;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [...post.tags, 'AI prompts', 'midjourney', 'dall-e'],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      url: `https://promptvault.io/post/${slug}`,
      images: [
        {
          url: isBase64 ? 'https://promptvault.io/placeholder-image.png' : firstImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: isBase64 ? [] : [firstImageUrl],
    },
  };
}

export default function PostPage() {
  return <PostContent />;
}
