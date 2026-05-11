import Link from 'next/link';
import Image from 'next/image';

import { Eye, Heart } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import { useData } from '@/components/context/DataContext';

const Badge = ({ style, toolName, toolInfo, className = "" }: { style: string; toolName: string; toolInfo: any; className?: string }) => {
  const isIconOnly = style === 'v8';
  
  const getBadgeStyle = () => {
    switch(style) {
      case 'v2': return `backdrop-blur-xl bg-white/20 dark:bg-black/30 border border-white/30 text-white shadow-xl`;
      case 'v3': return `bg-surface-900 border-2 border-primary-500 text-primary-500 shadow-[0_0_15px_rgba(var(--primary-500),0.5)]`;
      case 'v4': return `bg-surface-100 dark:bg-surface-800 border-b-4 border-r-4 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white shadow-md active:border-0 active:translate-x-[2px] active:translate-y-[2px]`;
      case 'v5': return `bg-surface-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-[8px] px-2 py-0.5 rounded-none`;
      case 'v6': return `bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 text-white border-0 shadow-lg animate-gradient-x`;
      case 'v7': return `bg-white dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-surface-100 dark:border-surface-700 rounded-2xl shadow-soft hover:scale-105 transition-transform`;
      case 'v8': return `bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10`;
      case 'v9': return `bg-transparent border-2 border-white/50 text-white font-black hover:bg-white hover:text-black transition-colors`;
      case 'v10': return `bg-primary-500 text-white [clip-path:polygon(0_0,100%_0,85%_100%,0%_100%)] pl-3 pr-6 py-1 font-black italic`;
      default: return `backdrop-blur-md ${toolInfo.color}/90 border border-white/20 text-white shadow-md`;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${getBadgeStyle()} ${className}`}>
      {toolInfo.logo ? (
        <div 
          className={`relative shrink-0 ${isIconOnly ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} bg-white rounded-full overflow-hidden p-[2px] shadow-sm`}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden" style={toolInfo.logoScale ? { transform: `scale(${toolInfo.logoScale})` } : undefined}>
            <Image src={toolInfo.logo} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      ) : null}
      {!isIconOnly && toolName}
    </div>
  );
};

export default function PostCard({ post, index, aspect }: { post: Post; index?: number; aspect?: string }) {
  const { settings } = useData();
  const allTools = getAllTools(post);
  const primaryTool = allTools.length > 0 ? allTools[0] : (post.images[0]?.aiTool || '');
  const toolInfo = getToolInfo(primaryTool, settings?.toolDetails);
  
  const cardStyle = settings?.cardStyle || 'v1';
  const badgeStyle = settings?.badgeStyle || 'v1';

  const renderBadges = (className = "") => (
    <div className="flex flex-wrap gap-1">
      {allTools.slice(0, 3).map(tool => (
        <Badge key={tool} style={badgeStyle} toolName={tool} toolInfo={getToolInfo(tool, settings?.toolDetails)} className={className} />
      ))}
      {allTools.length > 3 && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-black/50 backdrop-blur text-white shadow-md ${className}`}>
          +{allTools.length - 3}
        </div>
      )}
    </div>
  );

  if (cardStyle === 'v4') { // Social Card Layout
    return (
      <Link
        href={`/post/${post.slug || post.id}`}
        className={`group block bg-white dark:bg-surface-900 rounded-[24px] border border-surface-200 dark:border-surface-800 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary-500/50 break-inside-avoid mb-4 ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 animate-pulse flex items-center justify-center shrink-0">
             <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700" />
          </div>
          <div>
            <div className="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded mb-1" />
            <div className="h-3 w-16 bg-surface-100 dark:bg-surface-800 rounded" />
          </div>
        </div>
        <div className="relative aspect-square">
           <Image
            src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer" />
           <div className="absolute top-3 right-3">{renderBadges()}</div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-surface-900 dark:text-white text-base leading-snug line-clamp-2 mb-3">
            {post.title}
          </h3>
          <div className="flex items-center gap-4 text-surface-500 dark:text-surface-400">
             <span className="flex items-center gap-1 text-xs font-bold"><Heart className="w-4 h-4 text-red-500" />{post.likes}</span>
             <span className="flex items-center gap-1 text-xs font-bold"><Eye className="w-4 h-4 text-blue-500" />{post.views}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (cardStyle === 'v5') { // Brutalist Outline
    return (
      <Link
        href={`/post/${post.slug || post.id}`}
        className={`group block bg-white dark:bg-surface-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none break-inside-avoid mb-6 ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <div className="relative h-48 sm:h-64 border-b-4 border-black dark:border-white">
           <Image
            src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
            alt={post.title}
            fill
            className="object-cover"
            referrerPolicy="no-referrer" />
           <div className="absolute top-0 right-0 p-2">{renderBadges()}</div>
        </div>
        <div className="p-4">
          <h3 className="font-black text-black dark:text-white text-lg uppercase tracking-tighter mb-4 leading-none">
            {post.title}
          </h3>
          <div className="flex justify-between items-center border-t-2 border-black dark:border-white pt-3">
             <span className="font-black text-[10px] uppercase">By PromptHub</span>
             <div className="flex gap-3">
                <span className="text-xs font-black italic">{post.views} VWS</span>
                <span className="text-xs font-black italic text-primary-500">{post.likes} LKS</span>
             </div>
          </div>
        </div>
      </Link>
    );
  }

  if (cardStyle === 'v6') { // Gradient Overlay
    return (
      <Link
        href={`/post/${post.slug || post.id}`}
        className={`group block relative aspect-[4/5] rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] break-inside-avoid mb-6 ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <Image
          src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
           <div className="flex justify-end">{renderBadges()}</div>
           <div>
             <h3 className="font-bold text-white text-xl mb-4 leading-tight drop-shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform">
               {post.title}
             </h3>
             <div className="flex items-center gap-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                <span className="flex items-center gap-1 text-xs font-bold bg-white/10 backdrop-blur-md px-2 py-1 rounded-full"><Heart className="w-3.5 h-3.5" /> {post.likes}</span>
                <span className="flex items-center gap-1 text-xs font-bold bg-white/10 backdrop-blur-md px-2 py-1 rounded-full"><Eye className="w-3.5 h-3.5" /> {post.views}</span>
             </div>
           </div>
        </div>
      </Link>
    );
  }

  if (cardStyle === 'v7') { // Minimalist Polaroid
    return (
      <div className="break-inside-avoid mb-6">
        <Link
          href={`/post/${post.slug || post.id}`}
          className={`group block bg-white dark:bg-surface-800 p-3 sm:p-4 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 transition-all hover:-rotate-1 hover:scale-105 ${aspect ? aspect : ''}`}
          style={{ animationDelay: `${(index || 0) * 80}ms` }}
        >
          <div className="relative aspect-square rounded-sm overflow-hidden mb-4 bg-surface-100 dark:bg-surface-900">
             <Image
              src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
              alt={post.title}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              referrerPolicy="no-referrer" />
             <div className="absolute top-2 left-2">{renderBadges("scale-75 origin-top-left")}</div>
          </div>
          <div className="px-2 pb-2">
            <h3 className="font-serif italic text-lg text-surface-900 dark:text-white leading-tight mb-3">
              {post.title}
            </h3>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-tighter text-surface-400">
               <span>ID: {post.id.slice(0, 8)}</span>
               <span className="text-primary-500 font-bold">{post.likes} LIKES</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (cardStyle === 'v8') { // Glassmorphism Flat
    return (
       <Link
        href={`/post/${post.slug || post.id}`}
        className={`group block relative aspect-video rounded-[24px] overflow-hidden border border-white/20 dark:border-white/10 break-inside-avoid mb-6 ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <Image
          src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
          alt={post.title}
          fill
          className="object-cover blur-[2px] group-hover:blur-0 transition-all duration-500"
          referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all" />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-white/40 dark:bg-black/60 backdrop-blur-xl border-t border-white/20">
           <div className="flex justify-between items-start gap-3">
             <h3 className="font-bold text-surface-900 dark:text-white text-sm line-clamp-1 truncate flex-1">
               {post.title}
             </h3>
             {renderBadges("scale-90")}
           </div>
           <div className="flex items-center gap-3 mt-2">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-surface-200 dark:bg-surface-800 overflow-hidden text-[8px] flex items-center justify-center font-bold">U{i}</div>)}
              </div>
              <span className="text-[10px] text-surface-700 dark:text-surface-300 font-medium">Liked by {post.likes} users</span>
           </div>
        </div>
      </Link>
    );
  }

  if (cardStyle === 'v2') {
    return (
      <Link
        href={`/post/${post.slug || post.id}`}
        className={`group block relative rounded-lg overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 transition-all duration-300 hover:border-primary-500 break-inside-avoid shadow-sm hover:shadow-lg ${aspect ? aspect : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        <div className="relative overflow-hidden">
          <Image
            src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
            alt={post.title}
            width={500}
            height={700}
            priority={index != null && index < 3}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`w-full transition-transform duration-700 ease-in-out group-hover:scale-105 block ${aspect ? 'h-full object-cover' : 'h-auto'}`}
           referrerPolicy="no-referrer" />
          <div className="absolute top-2.5 left-2.5 z-10">
             {renderBadges()}
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
            src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
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
        src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
        alt={post.title}
        width={500}
        height={700}
        priority={index != null && index < 3}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`w-full transition-transform duration-700 ease-in-out group-hover:scale-105 block ${aspect ? 'h-full object-cover' : 'h-auto'}`}
       referrerPolicy="no-referrer" />
      
      {/* Overlay Gradient (appears on hover) */}
      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top Left AI Tool Badge - Hidden on Hover */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
        {renderBadges()}
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
