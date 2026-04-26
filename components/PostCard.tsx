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
  const primaryTool = getPrimaryTool(post);
  const toolInfo = getToolInfo(primaryTool, settings?.toolDetails);

  return (
    <Link
      href={`/post/${post.slug || post.id}`}
      className={`group block relative rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 break-inside-avoid mb-2 md:mb-4 ${aspect ? aspect : ''}`}
      style={{ animationDelay: `${(index || 0) * 80}ms` }}
    >
      <Image
        src={post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
        alt={post.title}
        width={500}
        height={700}
        sizes="(max-width: 768px) 50vw, 33vw"
        unoptimized
        className={`w-full transition-transform duration-700 ease-in-out group-hover:scale-105 block ${aspect ? 'h-full object-cover' : 'h-auto'}`}
      />
      
      {/* Overlay Gradient (appears on hover) */}
      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top right prompt count - always visible */}
      <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[9px] font-bold bg-black/50 text-white backdrop-blur-md uppercase tracking-wider shadow">
          {post.images.length} {post.images.length === 1 ? 'PROMPT' : 'PROMPTS'}
        </span>
      </div>

      {/* Bottom Info Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end h-full pointer-events-none">
        {/* Title and stats - Visible on Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 mb-2">
          <h3 className="font-bold text-white text-[14px] leading-tight line-clamp-3 drop-shadow-md">
            {post.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 font-bold text-[11px] text-white/90 drop-shadow-md">
              <Eye className="w-3.5 h-3.5 opacity-80" /> {post.views}
            </span>
            <span className="flex items-center gap-1 font-bold text-[11px] text-white/90 drop-shadow-md">
              <Heart className="w-3.5 h-3.5 opacity-80" /> {post.likes}
            </span>
          </div>
        </div>

        {/* AI Tool Badge - Always visible */}
        <div className="flex items-center">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] text-[10px] font-bold text-white shadow backdrop-blur-md saturate-150 ${toolInfo.color}/90 uppercase tracking-widest`}>
            {toolInfo.logo && (
              <div className="relative w-3.5 h-3.5 shrink-0 bg-white/20 rounded-[4px] overflow-hidden p-[1px]">
                <Image src={toolInfo.logo} alt="" fill className="object-contain" unoptimized />
              </div>
            )}
            {primaryTool}
          </div>
        </div>
      </div>
    </Link>
  );
}
