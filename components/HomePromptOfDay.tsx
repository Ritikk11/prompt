import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Crown, Heart, Tag, Wand2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getAllTools } from '@/lib/constants';

export default function HomePromptOfDay({ post }: { post?: Post }) {
  if (!post) return null;

  const prompt = post.images?.[0]?.prompt || post.description;
  const tools = getAllTools(post).slice(0, 3);
  const category = post.category || post.categories?.[0] || post.tags?.[0] || 'Creative prompt';
  const imageUrl = post.thumbnailUrl || post.images?.[0]?.url;

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-rose-800 px-5 py-16 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.12),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-amber-200 backdrop-blur-md">
          <Crown className="h-4 w-4" />
          Prompt of the Day
        </div>
        <h2 className="text-3xl font-black tracking-normal sm:text-4xl">Today&apos;s Featured Prompt</h2>
        <p className="mt-3 text-sm text-white/80">Handpicked from your published featured prompts</p>

        <div className={`mx-auto mt-8 grid overflow-hidden rounded-[32px] border border-white/15 bg-white/10 text-left shadow-2xl backdrop-blur-md ${imageUrl ? 'lg:grid-cols-[0.9fr_1.1fr]' : 'max-w-4xl'}`}>
          {imageUrl && (
            <Link href={`/${post.slug || post.id}`} className="group relative min-h-[320px] overflow-hidden bg-black/20 sm:min-h-[420px] lg:min-h-full">
              <Image
                src={imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover transition duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
              <span className="absolute left-5 top-5 rounded-full bg-black/45 px-4 py-1.5 text-xs font-black text-white backdrop-blur-md">
                Featured
              </span>
            </Link>
          )}

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold">{post.title}</h3>
              <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black text-amber-950">Featured</span>
            </div>
            <div className="mt-5 rounded-2xl bg-black/20 p-5 text-sm leading-7 text-white/90 line-clamp-5">
              {prompt}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/80">
              <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" /> {category}</span>
              {tools.length > 0 && <span className="inline-flex items-center gap-2"><Wand2 className="h-4 w-4" /> Best for {tools.join(', ')}</span>}
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> {post.likes || 0} likes</span>
            </div>
            <Link href={`/${post.slug || post.id}`} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5">
              View This Prompt
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
