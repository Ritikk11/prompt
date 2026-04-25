import Link from 'next/link';
import Image from 'next/image';

import { Eye, Heart } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';

function getPrimaryTool(post: Post) {
  const tools: Record<string, number> = {};
  post.images.forEach(img => {
    tools[img.aiTool] = (tools[img.aiTool] || 0) + 1;
  });
  return Object.entries(tools).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

export default function PostCard({ post, index, aspect }: { post: Post; index?: number; aspect?: string }) {
  const primaryTool = getPrimaryTool(post);
  const toolInfo = getToolInfo(primaryTool);

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
      
      {/* Overlay Gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top badges (Floating Pill Style) */}
      <div className="absolute top-2.5 left-2.5 z-10 transition-transform duration-300 group-hover:translate-y-[-2px]">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-sm backdrop-blur-md ${toolInfo.color}/60 border border-white/10 uppercase tracking-wider`}>
          {toolInfo.logo ? (
            <div className="relative w-3 h-3 shrink-0 bg-white/20 rounded-full overflow-hidden p-0.5">
              <Image src={toolInfo.logo} alt="" fill className="object-contain" unoptimized />
            </div>
          ) : null}
          {primaryTool}
        </div>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10 transition-transform duration-300 group-hover:translate-y-[-2px]">
        <span className="px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-black/30 text-white backdrop-blur-md shadow-sm border border-white/10 italic">
          {post.images.length} {post.images.length === 1 ? 'PROMPT' : 'PROMPTS'}
        </span>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <h3 className="font-bold text-white text-[13px] sm:text-[14px] leading-tight line-clamp-2 drop-shadow-md">
          {post.title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 ml-auto">
            <span className="flex items-center gap-1 text-white/90 text-[10px] font-bold">
              <Eye className="w-3 h-3" /> {post.views}
            </span>
            <span className="flex items-center gap-1 text-white/90 text-[10px] font-bold">
              <Heart className="w-3 h-3" /> {post.likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
