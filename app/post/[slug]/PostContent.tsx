'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import Image from 'next/image';
import { Copy, Check, Eye, Heart, Calendar, Tag, ChevronLeft, Clock, ArrowRight, Lock, Download, ZoomIn, X, DownloadCloud } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import { getGridClasses } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { getToolInfo } from '@/lib/constants';
import { useState } from 'react';
import TemplatePrompt from '@/components/TemplatePrompt';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

import ReactMarkdown from 'react-markdown';
import CopyButton from '@/components/CopyButton';

const PostCard = dynamic(() => import('@/components/PostCard'));
const AdSlot = dynamic(() => import('@/components/AdSlot'), { ssr: false });

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PostContent() {
  const { slug } = useParams();
  const { incrementViews, toggleLike, posts, loading, settings } = useData();
  const viewIncrementedRef = useRef(false);

  const [lightboxImage, setLightboxImage] = useState<{ url: string; index: number; tool: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

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

  const allPromptsText = settings.features?.premiumPrompts && post.isPremium && !user 
    ? "Premium Collection - Please sign in to view full prompts." 
    : (post.images || []).map((img, i) => `Image ${i + 1} (${img.aiTool}):\n${img.prompt}`).join('\n\n');

  const postHeroStyle = settings.postHeroStyle || 'v1';

  const renderMetaInfo = () => {
    const isV2 = postHeroStyle === 'v2';
    const containerClasses = isV2
      ? 'bg-black/40 border-white/10 text-white/90 backdrop-blur-md'
      : 'text-surface-500 bg-surface-50 dark:bg-surface-900/50 border-surface-200 dark:border-surface-800';
    
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-medium py-3 px-6 rounded-full border transition-colors ${containerClasses}`}>
        <span className="flex items-center gap-1.5">
          <Eye className={`w-4.5 h-4.5 ${isV2 ? 'text-white' : 'text-primary-500'}`} /> {(post.views || 0).toLocaleString()} <span className="hidden sm:inline">views</span>
        </span>
        <span className={`w-1 h-1 rounded-full ${isV2 ? 'bg-white/30' : 'bg-surface-300 dark:bg-surface-700'}`} />
        <button
          onClick={() => toggleLike(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${
            post.likedByUser ? 'text-red-500' : isV2 ? 'hover:text-red-400' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-4.5 h-4.5 ${post.likedByUser ? 'fill-current animate-heart-pop text-red-500' : ''}`} /> {(post.likes || 0).toLocaleString()} <span className="hidden sm:inline">likes</span>
        </button>
        <span className={`w-1 h-1 rounded-full ${isV2 ? 'bg-white/30' : 'bg-surface-300 dark:bg-surface-700'}`} />
        <span className="flex items-center gap-1.5">
          <Clock className="w-4.5 h-4.5" /> {formatDate(post.createdAt)}
        </span>
      </div>
    );
  };

  const renderHero = () => {
    switch (postHeroStyle) {
      case 'v2': // Immersive Blur Background
        return (
          <div className="relative mb-12 w-full rounded-[32px] overflow-hidden bg-surface-900 shadow-2xl group min-h-[500px] flex items-end">
            <Image src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} alt="bg" fill className="object-cover opacity-40 blur-xl scale-110"  referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="relative z-20 p-8 md:p-12 w-full max-w-4xl mx-auto flex flex-col items-center text-center pb-12">
              <div className="relative w-full max-w-lg aspect-[4/3] mb-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image 
                  src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={post.title} 
                  fill 
                  className="object-contain bg-black/20" 
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md backdrop-blur-md mb-6 saturate-150 ${heroToolInfo.color}/90 border border-white/20 uppercase tracking-widest`}>
                {heroToolInfo.logo && (
                  <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                    <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                      <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
                {post.images[0]?.aiTool}
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">{post.title}</h1>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed mb-8 drop-shadow">{post.description}</p>
              {renderMetaInfo()}
            </div>
          </div>
        );
      case 'v3': // Diagonal Split
        return (
          <div className="relative mb-12 w-full rounded-[32px] overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl">
             <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                <div className="flex flex-col justify-center p-8 md:p-12 order-2 md:order-1">
                   <div className="flex flex-wrap items-center gap-2 mb-4">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${heroToolInfo.color}/90 uppercase tracking-wider`}>
                       {heroToolInfo.logo && (
                         <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                           <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                             <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                           </div>
                         </div>
                       )}
                       {post.images[0]?.aiTool}
                     </span>
                     {post.featured && <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300">⭐ Featured</span>}
                   </div>
                   <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 leading-tight">{post.title}</h1>
                   <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg mb-8 line-clamp-4">{post.description}</p>
                   <div className="flex justify-start">{renderMetaInfo()}</div>
                </div>
                <div className="relative order-1 md:order-2 h-64 md:h-auto min-h-[300px] bg-surface-100 dark:bg-surface-800/30 flex items-center justify-center p-6 lg:p-10">
                   <Image src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} alt="" fill className="object-cover blur-3xl opacity-20 scale-125 z-0"  referrerPolicy="no-referrer" />
                   <div className="max-h-[400px] w-full max-w-[800px] h-full sm:w-[600px] rounded-[24px] shadow-2xl relative z-10 overflow-hidden">
                     <Image src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} alt={post.title} fill className="object-contain" referrerPolicy="no-referrer" />
                   </div>
                </div>
             </div>
          </div>
        );
      case 'v4': // Minimalist Text
        return (
          <div className="mb-12 flex flex-col items-center text-center mt-6 md:mt-10">
            <span className={`mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-lg ${heroToolInfo.color}/90 saturate-150`}>
                {heroToolInfo.logo && (
                  <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                    <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                      <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
                {post.images[0]?.aiTool}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-surface-900 dark:text-white mb-6 tracking-tight leading-tight max-w-4xl">{post.title}</h1>
            <p className="text-surface-600 dark:text-surface-400 text-lg md:text-2xl max-w-3xl leading-relaxed mb-8 font-medium">{post.description}</p>
            <div className="relative w-full max-w-2xl aspect-video mb-10 rounded-3xl overflow-hidden shadow-xl bg-surface-100 dark:bg-surface-800/50 p-4">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                <Image 
                  src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={post.title} 
                  fill 
                  className="object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {renderMetaInfo()}
          </div>
        );
      case 'v5': // Asymmetric Offset
        return (
          <div className="relative mb-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black text-white ${heroToolInfo.color}/90 mb-4 uppercase tracking-[0.2em] shadow-md`}>
                {heroToolInfo.logo && (
                  <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                    <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                      <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
                {post.images[0]?.aiTool}
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-surface-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                {post.title}
              </h1>
              <p className="text-surface-600 dark:text-surface-400 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl border-l-4 border-primary-500 pl-6">
                {post.description}
              </p>
              <div className="flex justify-start">{renderMetaInfo()}</div>
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 relative aspect-[3/4] lg:aspect-auto lg:h-[600px] rounded-[40px] overflow-hidden shadow-2xl skew-y-2 lg:skew-y-0 lg:-rotate-2 hover:rotate-0 transition-transform duration-700">
               <Image 
                src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                alt={post.title} 
                fill 
                className="object-cover" 
                referrerPolicy="no-referrer"
                priority
              />
            </div>
          </div>
        );
      case 'v6': // Cyberpunk Bordered
        return (
          <div className="relative mb-16 w-full p-1 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-[32px] shadow-[0_20px_50px_rgba(var(--primary-500),0.3)]">
            <div className="bg-white dark:bg-surface-950 rounded-[30px] p-8 md:p-12 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex gap-2 mb-6">
                       <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest">AI GENERATED</span>
                       <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-white text-[10px] font-black uppercase tracking-widest ${heroToolInfo.color}/90 shadow-md`}>
                        {heroToolInfo.logo && (
                          <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                            <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                              <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}
                        {post.images[0]?.aiTool}
                       </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-surface-900 dark:text-white mb-6 uppercase tracking-tighter italic">
                      {post.title}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-base md:text-lg mb-8 font-medium">
                      {post.description}
                    </p>
                    <div className="flex justify-start">{renderMetaInfo()}</div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-surface-900 shadow-2xl rotate-1">
                    <Image 
                      src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                      alt={post.title} 
                      fill 
                      className="object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
               </div>
            </div>
          </div>
        );
      case 'v7': // Full Screen Hero
        return (
          <div className="relative w-full h-[80vh] min-h-[600px] mb-12 rounded-[48px] overflow-hidden group">
             <Image 
              src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
              alt={post.title} 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-105" 
              referrerPolicy="no-referrer"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 md:p-16 text-center">
               <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black text-white ${heroToolInfo.color}/80 backdrop-blur-md mb-6 uppercase tracking-widest border border-white/20 shadow-xl`}>
                 {heroToolInfo.logo && (
                    <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                      <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                        <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
                 {post.images[0]?.aiTool}
               </span>
               <h1 className="text-4xl md:text-7xl font-black text-white mb-6 max-w-5xl leading-tight">
                 {post.title}
               </h1>
               <div className="mb-10 scale-110">{renderMetaInfo()}</div>
            </div>
          </div>
        );
      case 'v8': // Floating Card
        return (
          <div className="relative mb-20 md:mb-32">
             <div className="relative w-full h-64 md:h-96 rounded-[32px] overflow-hidden">
                <Image 
                  src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={post.title} 
                  fill 
                  className="object-cover blur-2xl opacity-50 scale-110" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-surface-950" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0 md:-translate-y-1/2 w-[95%] max-w-5xl bg-white dark:bg-surface-900 rounded-[32px] shadow-2xl border border-surface-100 dark:border-surface-800 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
                <div className="w-full md:w-1/2 aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shrink-0">
                  <Image 
                    src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                    alt={post.title} 
                    fill 
                    className="object-cover" 
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black text-white ${heroToolInfo.color} mb-4 uppercase tracking-widest shadow-md`}>
                    {heroToolInfo.logo && (
                      <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                        <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                          <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                    {post.images[0]?.aiTool}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black text-surface-900 dark:text-white mb-4 tracking-tight leading-tight">
                    {post.title}
                  </h1>
                  <p className="text-surface-500 dark:text-surface-400 mb-8 line-clamp-3 italic font-medium">
                    &quot;{post.description}&quot;
                  </p>
                  <div className="scale-90 origin-left">{renderMetaInfo()}</div>
                </div>
             </div>
          </div>
        );
      case 'v1':
      default: // Natural layout
        return (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 tracking-tight leading-tight max-w-4xl">{post.title}</h1>
              <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg max-w-3xl leading-relaxed mb-6">{post.description}</p>
              {renderMetaInfo()}
            </div>
            <div className="relative mb-12 w-full max-w-5xl mx-auto flex justify-center">
              <div className="relative w-full flex justify-center rounded-[32px] overflow-hidden bg-surface-100 dark:bg-surface-800/30 p-2 sm:p-4">
                <div className="w-full h-full max-h-[75vh] min-h-[40vh] sm:min-h-[50vh] rounded-[24px] shadow-md relative overflow-hidden">
                  <Image
                    src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
                    alt={post.title}
                    fill
                    className="object-contain"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
                <div className="absolute top-6 left-6 z-20">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-md backdrop-blur-md saturate-150 ${heroToolInfo.color}/90 border border-white/20 uppercase tracking-widest`}>
                    {heroToolInfo.logo && (
                      <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                        <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm">
                          <Image src={heroToolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                    {post.images[0]?.aiTool}
                  </span>
                </div>
                {post.featured && (
                  <div className="absolute top-6 right-6 z-20">
                    <span className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-400 text-yellow-900 border border-yellow-300 shadow-md uppercase tracking-widest">
                      ⭐ Featured
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-1 py-4 sm:py-6 fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-6 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronLeft className="w-3.5 h-3.5 rotate-180 opacity-50" />
        <span className="truncate text-surface-900 dark:text-white max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Header & Hero styles */}
      {renderHero()}

      <AdSlot placement="postTop" />

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
          {(post.images || []).map((img, index) => (
            <div
              key={img.id}
              className="group rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image + Prompt layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Image — no cropping, natural display */}
                <div className="relative bg-surface-50 dark:bg-surface-800 flex items-center justify-center p-3 sm:p-5">
                  <div className="relative w-full overflow-hidden rounded-2xl shadow-lg group-hover:scale-[1.01] transition-transform duration-500 group/img">
                    <div className="w-full relative rounded-2xl overflow-hidden cursor-zoom-in flex items-center justify-center bg-surface-100 dark:bg-surface-900" onClick={() => setLightboxImage({ url: img.url || '', index, tool: img.aiTool })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url || 'https://picsum.photos/seed/placeholder/800/600'}
                        alt={`Prompt ${index + 1}`}
                        className="w-full h-auto block rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute top-4 left-4 z-20">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-bold text-white shadow-xl backdrop-blur-md ${getToolInfo(img.aiTool, settings?.toolDetails).color}/80 border border-white/10 uppercase tracking-wider`}>
                        {getToolInfo(img.aiTool, settings?.toolDetails).logo && (
                          <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                            <div 
                              className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm flex items-center justify-center p-[1px]"
                            >
                              <div className="relative w-full h-full" style={getToolInfo(img.aiTool, settings?.toolDetails).logoScale ? { transform: `scale(${getToolInfo(img.aiTool, settings?.toolDetails).logoScale})` } : undefined}>
                                <Image src={getToolInfo(img.aiTool, settings?.toolDetails).logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                              </div>
                            </div>
                          </div>
                        )}
                        {img.aiTool}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-2.5 py-1.5 rounded-full text-[9px] font-bold bg-black/40 text-white backdrop-blur-md border border-white/10 uppercase tracking-widest shadow-xl">
                        PROMPT #{index + 1}
                      </span>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none rounded-2xl" />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity translate-y-2 group-hover/img:translate-y-0 duration-300 z-30">
                      <button
                        title="Download Image"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (img.url) handleDownload(img.url, `prompt_${post.id}_${index + 1}.png`);
                        }}
                        className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:scale-110 transition-all shadow-xl"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        title="View Fullscreen"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ url: img.url || '', index, tool: img.aiTool });
                        }}
                        className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:scale-110 transition-all shadow-xl"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    {settings.features?.premiumPrompts && post.isPremium && !user ? (
                       <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-6 mb-6 text-center border border-surface-200/50 dark:border-surface-700/50 relative overflow-hidden group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
                         <div className="absolute inset-0 bg-surface-50/80 dark:bg-surface-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6">
                           <Lock className="w-8 h-8 text-yellow-500 mb-3" />
                           <h4 className="font-bold text-lg mb-1">Premium Prompt</h4>
                           <p className="text-sm text-surface-500 mb-4 max-w-sm">
                             Sign in to view and copy this engineered prompt.
                           </p>
                           {settings.features?.premiumPaymentUrl ? (
                             <a href={settings.features?.premiumPaymentUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg">
                               Unlock All for ${settings.features?.premiumPrice || 5}
                             </a>
                           ) : (
                             <button onClick={handleLogin} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 shadow-lg">
                               Sign in to Unlock
                             </button>
                           )}
                         </div>
                         <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono filter blur-[4px] truncate">
                           {img.prompt.slice(0, 100)}...
                         </p>
                       </div>
                    ) : settings.features?.smartTemplates && img.prompt.includes('[') && img.prompt.includes(']') ? (
                       <TemplatePrompt originalPrompt={img.prompt} />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                            <h3 className="font-bold text-base tracking-tight">Prompt</h3>
                          </div>
                          <CopyButton text={img.prompt} />
                        </div>
                        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-6 mb-6 border border-surface-200/50 dark:border-surface-700/50 group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
                          <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono">
                            {img.prompt}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-surface-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-primary-500/50" />
                    Model: <span className="text-surface-600 dark:text-surface-200">{img.model || img.aiTool}</span>
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

      <AdSlot placement="postBottom" />

      {/* Tags */}
      <div className="mb-16">
        <h3 className="text-sm font-bold text-surface-400 uppercase tracking-[0.2em] mb-6">Discovery Tags</h3>
        <div className="flex flex-wrap gap-2.5">
          {(post.tags || []).map(tag => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white transition-all transform hover:-translate-y-1 shadow-sm uppercase tracking-wider"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {settings.features?.comments && (
        <div className="mb-16 border-t border-surface-200 dark:border-surface-800 pt-16">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-8">Comments & Feedback</h3>
          <div className="bg-surface-50 dark:bg-surface-800/30 rounded-2xl p-8 text-center border border-surface-200 dark:border-surface-800">
            {user ? (
               <div className="max-w-2xl mx-auto flex flex-col gap-4">
                 <textarea
                   rows={3}
                   placeholder="Share your experience using these prompts, or post your own variations..."
                   className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none transition-colors text-sm resize-none"
                 />
                 <div className="flex justify-end">
                   <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                     Post Comment
                   </button>
                 </div>
               </div>
            ) : (
               <div>
                 <p className="text-surface-500 mb-4">Join the discussion and share your results.</p>
                 <button onClick={handleLogin} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                   Sign in to Comment
                 </button>
               </div>
            )}
            
            <div className="mt-12 text-left">
              <p className="text-sm font-medium text-surface-400 mb-6">0 comments</p>
              {/* Future comment list maps here */}
            </div>
          </div>
        </div>
      )}

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
          <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns) + " mb-16"}>
            {relatedPosts.map((p, i) => (
              <div key={p.id} className="mb-1 inline-block w-full break-inside-avoid">
                <PostCard post={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extended HTML / Article Description */}
      {post.extendedDescription && (
        <div className="border-t border-surface-200 dark:border-surface-800 pt-16 mb-16">
          <div className="max-w-4xl mx-auto text-surface-900 dark:text-surface-100">
            <ReactMarkdown
              components={{
                h1: (props) => <h1 className="text-4xl font-extrabold mt-8 mb-4 tracking-tight" {...props} />,
                h2: (props) => <h2 className="text-3xl font-bold mt-10 mb-4 tracking-tight" {...props} />,
                h3: (props) => <h3 className="text-2xl font-semibold mt-8 mb-3" {...props} />,
                p: (props) => <p className="text-lg leading-relaxed mb-6 text-surface-700 dark:text-surface-300" {...props} />,
                ol: (props) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-surface-700 dark:text-surface-300" {...props} />,
                ul: (props) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-surface-700 dark:text-surface-300" {...props} />,
                li: (props) => <li className="pl-1" {...props} />,
                a: (props) => <a className="text-primary-500 hover:underline font-medium" {...props} />,
                strong: (props) => <strong className="font-bold text-surface-900 dark:text-white" {...props} />,
                blockquote: (props) => <blockquote className="border-l-4 border-primary-500 pl-4 py-1 italic text-surface-600 dark:text-surface-400 my-6 bg-surface-50 dark:bg-surface-800/50 rounded-r-lg" {...props} />,
                hr: (props) => <hr className="my-10 border-surface-200 dark:border-surface-800" {...props} />,
                code: (props) => <code className="bg-surface-100 dark:bg-surface-800 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
              }}
            >
              {post.extendedDescription}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 transition-opacity"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Toolbar */}
            <div className="absolute top-0 right-0 flex items-center gap-4 z-50 p-4">
              <button 
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(lightboxImage.url, `prompt_${post.id}_${lightboxImage.index + 1}.png`);
                }}
                title="Download Image"
              >
                <Download className="w-6 h-6" />
              </button>
              <button 
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImage(null);
                }}
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Image */}
            <div 
              className="relative w-full h-full max-h-[90vh] flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white shadow-xl backdrop-blur-md ${getToolInfo(lightboxImage.tool, settings?.toolDetails).color}/80 border border-white/10 uppercase tracking-wider`}>
                  {getToolInfo(lightboxImage.tool, settings?.toolDetails).logo && (
                    <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                      <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm flex items-center justify-center p-[1px]">
                        <div className="relative w-full h-full" style={getToolInfo(lightboxImage.tool, settings?.toolDetails).logoScale ? { transform: `scale(${getToolInfo(lightboxImage.tool, settings?.toolDetails).logoScale})` } : undefined}>
                          <Image src={getToolInfo(lightboxImage.tool, settings?.toolDetails).logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>
                  )}
                  {lightboxImage.tool}
                </div>
              </div>
              <div className="absolute top-4 right-4 z-20 hidden md:block pointer-events-none">
                 <span className="px-3 py-2 rounded-full text-xs font-bold bg-black/40 text-white backdrop-blur-md border border-white/10 uppercase tracking-widest shadow-xl">
                   PROMPT #{lightboxImage.index + 1}
                 </span>
              </div>
              <div className="w-full h-full max-h-[90vh] overflow-hidden rounded-2xl relative">
                <Image
                  src={lightboxImage.url}
                  alt={`Prompt ${lightboxImage.index + 1}`}
                  fill
                  className="object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
