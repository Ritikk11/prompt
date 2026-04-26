'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import Image from 'next/image';
import { Copy, Check, Eye, Heart, Calendar, Tag, ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import PostCard from '@/components/PostCard';
import { getToolInfo } from '@/lib/constants';
import { useState } from 'react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-surface-600 dark:text-surface-300 hover:text-primary-600'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function PostContent() {
  const { slug } = useParams();
  const { incrementViews, toggleLike, posts, loading, settings } = useData();
  const viewIncrementedRef = useRef(false);

  const post = posts.find((p) => p.slug === slug || p.id === slug);
  const heroToolInfo = post ? getToolInfo(post.images[0]?.aiTool || '', settings?.toolDetails) : { color: '', logo: '' };

  useEffect(() => {
    if (post && !viewIncrementedRef.current) {
      incrementViews(post.id);
      viewIncrementedRef.current = true;
    }
  }, [post, incrementViews]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
        <p className="text-surface-500 font-medium animate-pulse">Loading prompt details...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">Post not found</h2>
        <p className="text-surface-500 mb-8">This prompt might have been moved or deleted.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20">
          Return to Gallery
        </Link>
      </div>
    );
  }

  const relatedPosts = posts
    .filter(p => p.id !== post.id && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 4);

  const allPromptsText = post.images.map((img, i) => `Image ${i + 1} (${img.aiTool}):\n${img.prompt}`).join('\n\n');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-6 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronLeft className="w-3.5 h-3.5 rotate-180 opacity-50" />
        <span className="truncate text-surface-900 dark:text-white max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 tracking-tight leading-tight max-w-4xl">{post.title}</h1>
        <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg max-w-3xl leading-relaxed mb-6">{post.description}</p>
        
        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-medium text-surface-500 bg-surface-50 dark:bg-surface-900/50 py-3 px-6 rounded-full border border-surface-200 dark:border-surface-800">
          <span className="flex items-center gap-1.5">
            <Eye className="w-4.5 h-4.5 text-primary-500" /> {post.views.toLocaleString()} <span className="hidden sm:inline">views</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
          <button
            onClick={() => toggleLike(post.id)}
            className={`flex items-center gap-1.5 transition-colors ${
              post.likedByUser ? 'text-red-500' : 'hover:text-red-400'
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${post.likedByUser ? 'fill-current animate-heart-pop' : ''}`} /> {post.likes.toLocaleString()} <span className="hidden sm:inline">likes</span>
          </button>
          <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
          <span className="flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5" /> {formatDate(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Hero Image — Natural layout without massive background box */}
      <div className="relative mb-12 w-full max-w-5xl mx-auto flex justify-center">
        <div className="relative w-full flex justify-center rounded-[32px] overflow-hidden bg-surface-100 dark:bg-surface-800/30">
          <img
            src={post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
            alt={post.title}
            className="w-auto max-w-full max-h-[80vh] h-auto object-contain"
            loading="eager"
          />
          <div className="absolute top-4 left-4 z-20">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-md backdrop-blur-md saturate-150 ${heroToolInfo.color}/90 border border-white/20 uppercase tracking-widest`}>
              {heroToolInfo.logo && (
                <div className="relative w-4 h-4 shrink-0 bg-black/10 rounded overflow-hidden p-[1px]">
                  <Image src={heroToolInfo.logo} alt="" fill className="object-contain" unoptimized />
                </div>
              )}
              {post.images[0]?.aiTool}
            </span>
          </div>
          {post.featured && (
            <div className="absolute top-4 right-4 z-20">
              <span className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-400 text-yellow-900 border border-yellow-300 shadow-md uppercase tracking-widest">
                ⭐ Featured
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Images with Prompts — NO cropping, natural display */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Prompt Gallery <span className="text-surface-400 font-medium ml-1">({post.images.length})</span>
          </h2>
        </div>

        <div className="space-y-10">
          {post.images.map((img, index) => (
            <div
              key={img.id}
              className="group rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image + Prompt layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Image — no cropping, natural display */}
                <div className="relative bg-surface-50 dark:bg-surface-800 flex items-center justify-center p-3 sm:p-5">
                  <div className="relative w-full overflow-hidden rounded-2xl shadow-lg group-hover:scale-[1.01] transition-transform duration-500">
                    <img
                      src={img.url || 'https://picsum.photos/seed/placeholder/800/600'}
                      alt={`Prompt ${index + 1}`}
                      className="w-full h-auto block rounded-2xl shadow-inner border border-black/5 dark:border-white/5"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 z-20">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-bold text-white shadow-xl backdrop-blur-md ${getToolInfo(img.aiTool, settings?.toolDetails).color}/80 border border-white/10 uppercase tracking-wider`}>
                        {getToolInfo(img.aiTool, settings?.toolDetails).logo && (
                          <div className="relative w-3.5 h-3.5 shrink-0 bg-white/20 rounded-full p-0.5 overflow-hidden">
                            <Image src={getToolInfo(img.aiTool, settings?.toolDetails).logo} alt="" fill className="object-contain" unoptimized />
                          </div>
                        )}
                        {img.aiTool}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-2.5 py-1.5 rounded-full text-[9px] font-bold bg-black/40 text-white backdrop-blur-md border border-white/10 uppercase tracking-widest shadow-xl">
                        PROMPT #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                        <h3 className="font-bold text-base tracking-tight">AI Instruction</h3>
                      </div>
                      <CopyButton text={img.prompt} />
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-6 mb-6 border border-surface-200/50 dark:border-surface-700/50 group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
                      <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono">
                        {img.prompt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-surface-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-primary-500/50" />
                    Engine: <span className="text-surface-600 dark:text-surface-200">{img.aiTool}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Copy All Prompts CTA */}
      <div className="mb-16 p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 text-white text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:scale-150 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl translate-y-32 -translate-x-32 group-hover:scale-150 transition-transform duration-1000" />
        
        <div className="relative z-10">
          <h3 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">Copy Entire Collection</h3>
          <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">Grab all {post.images.length} creative prompts instantly to use in your favorite AI generator.</p>
          <div className="flex justify-center">
             <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20">
               <CopyButton text={allPromptsText} />
             </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-16">
        <h3 className="text-sm font-bold text-surface-400 uppercase tracking-[0.2em] mb-6">Discovery Tags</h3>
        <div className="flex flex-wrap gap-2.5">
          {post.tags.map(tag => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white transition-all transform hover:-translate-y-1 shadow-sm uppercase tracking-wider"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="border-t border-surface-200 dark:border-surface-800 pt-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary-500 rounded-full underline-offset-8" />
              <h2 className="text-2xl font-black tracking-tight">Related Prompts</h2>
            </div>
            <Link href="/explore" className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-2 group">
              Explore More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 md:gap-4 px-0">
            {relatedPosts.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
