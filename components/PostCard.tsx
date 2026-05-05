import Link from 'next/link';
import Image from 'next/image';

import { Eye, Heart } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';
import { useData } from '@/components/context/DataContext';

function getPrimaryTool(post: Post) {
  const tools: Record<string, number> = {};
  post.images.forEach(img => {
    tools[img.aiTool] = (tools[img.aiTool] || 0) + 1;
  });
  return Object.entries(tools).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

export default function PostCard({ post, index, aspect }: { post: Post; index?: number; aspect?: string }) {
  const { settings } = useData();
  const imageUrl = post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600';
  const primaryTool = getPrimaryTool(post);
  const toolInfo = getToolInfo(primaryTool, settings?.toolDetails);
  
  const cardStyle = settings?.cardStyle || 'v1';

  if (cardStyle === 'v2') {
    return (
      <Link
        href={`/post/${post.slug || post.id}`}
        className={`group block relative rounded-lg overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 transition-all duration-300 hover:border-primary-500 break-inside-avoid shadow-sm hover:shadow-lg ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <div className="relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={post.title}
            width={500}
            height={700}
            priority={index != null && index < 4}
            sizes="(max-width: 768px) 50vw, 33vw"
            className={`w-full transition-transform duration-700 ease-in-out group-hover:scale-105 block ${aspect ? 'h-full object-cover' : 'h-auto'}`}
           referrerPolicy="no-referrer" />
          <div className="absolute top-2 left-2 z-10">
             <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-white shadow-sm backdrop-blur-md ${toolInfo.color}/90 border border-white/20 uppercase tracking-wider`}>
              {toolInfo.logo ? (
                <div 
                  className="relative w-2.5 h-2.5 shrink-0 bg-white/20 rounded-full overflow-hidden p-[1px]"
                  style={toolInfo.logoScale ? { transform: `scale(${toolInfo.logoScale})` } : undefined}
                >
                  <Image src={toolInfo.logo} alt="" fill className="object-contain"  referrerPolicy="no-referrer" />
                </div>
              ) : null}
              {primaryTool}
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-bold text-surface-900 dark:text-white text-[13px] sm:text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center justify-between text-surface-500 dark:text-surface-400">
             <span className="text-[10px] font-medium opacity-80">{post.images.length} {post.images.length === 1 ? 'Prompt' : 'Prompts'}</span>
             <div className="flex gap-2.5">
               <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium"><Eye className="w-3.5 h-3.5" />{post.views}</span>
               <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium"><Heart className="w-3.5 h-3.5" />{post.likes}</span>
             </div>
          </div>
        </div>
      </Link>
    );
  }

  if (cardStyle === 'v3') {
    return (
      <Link
        href={`/post/${post.slug || post.id}`}
        className={`group flex items-center gap-3 p-2 rounded-xl overflow-hidden bg-white/50 dark:bg-surface-900/50 hover:bg-white dark:hover:bg-surface-800 border border-surface-200/50 dark:border-surface-700/50 transition-all duration-300 break-inside-avoid shadow-sm hover:shadow-md ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden flex-none">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="100px"
            priority={index != null && index < 6}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
           referrerPolicy="no-referrer" />
        </div>
        <div className="flex flex-col min-w-0 py-1">
          <div className="flex items-center gap-1 mb-1">
             <div className={`w-2 h-2 rounded-full ${toolInfo.color}`} />
             <span className="text-[9px] uppercase tracking-wider font-bold text-surface-500 dark:text-surface-400 truncate">{primaryTool}</span>
          </div>
          <h3 className="font-bold text-surface-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary-500 transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 mb-0.5 text-surface-400 dark:text-surface-500">
             <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium"><Eye className="w-3 h-3" />{post.views}</span>
             <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium"><Heart className="w-3 h-3" />{post.likes}</span>
          </div>
        </div>
      </Link>
    );
  }

  // cardStyle === 'v1'
  return (
    <Link
      href={`/post/${post.slug || post.id}`}
      className={`group block relative rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 break-inside-avoid ${aspect ? aspect : ''}`}
      style={{ animationDelay: `${(index || 0) * 80}ms` }}
    >
      <Image
        src={imageUrl}
        alt={post.title}
        width={500}
        height={700}
        priority={index != null && index < 6}
        sizes="(max-width: 768px) 50vw, 33vw"
        className={`w-full transition-transform duration-700 ease-in-out group-hover:scale-105 block ${aspect ? 'h-full object-cover' : 'h-auto'}`}
       referrerPolicy="no-referrer" />
      
      {/* Overlay Gradient (appears on hover) */}
      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top Left AI Tool Badge - Hidden on Hover */}
      <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-sm backdrop-blur-md ${toolInfo.color}/80 border border-white/10 uppercase tracking-wider`}>
          {toolInfo.logo ? (
            <div 
              className="relative w-3 h-3 shrink-0 bg-white/20 rounded-full overflow-hidden p-0.5 mt-[-1px]"
              style={toolInfo.logoScale ? { transform: `scale(${toolInfo.logoScale})` } : undefined}
            >
              <Image src={toolInfo.logo} alt="" fill className="object-contain"  referrerPolicy="no-referrer" />
            </div>
          ) : null}
          {primaryTool}
        </div>
      </div>

      {/* Bottom Left Prompt Count - Hidden on Hover */}
      <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
        <span className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[9px] font-bold bg-black/40 text-white backdrop-blur-md italic border border-white/10 shadow-sm">
          {post.images.length} {post.images.length === 1 ? 'PROMPT' : 'PROMPTS'}
        </span>
      </div>

      {/* Bottom Info Section (Title & Stats) - Visible on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <h3 className="font-bold text-white text-[13px] sm:text-[14px] leading-tight line-clamp-3 drop-shadow-md">
            {post.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-white/90 drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              <Eye className="w-3 h-3 opacity-90" /> {post.views}
            </span>
            <span className="flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-white/90 drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              <Heart className="w-3 h-3 opacity-90" /> {post.likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
