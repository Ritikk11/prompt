'use client';

import { Share2, Link as LinkIcon } from 'lucide-react';
import {
  XLogo,
  InstagramLogo,
  FacebookLogo,
  PinterestLogo,
  WhatsAppLogo,
} from '@/components/SocialLogos';
import { usePostPage } from './PostPageProvider';
import type { ShareTarget } from '@/lib/types';

interface PostShareCardProps {
  postTitle: string;
  postSlugOrId: string;
  thumbnailUrl?: string;
  className?: string;
}

const shareTargets: ShareTarget[] = ['whatsapp', 'x', 'copy', 'facebook', 'pinterest', 'instagram'];

export default function PostShareCard({
  postTitle,
  postSlugOrId,
  thumbnailUrl = '',
  className = '',
}: PostShareCardProps) {
  const { showFeedback } = usePostPage();

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aipromptmatrix.in';
  const pageUrl = `${siteUrl}/${postSlugOrId}`;

  const shareButtonMeta: Record<
    ShareTarget,
    { label: string; title: string; className: string; icon: React.ReactNode }
  > = {
    whatsapp: {
      label: 'WhatsApp',
      title: 'Share on WhatsApp',
      className: 'text-emerald-600 hover:bg-emerald-600 hover:text-white',
      icon: <WhatsAppLogo className="h-4 w-4" />,
    },
    x: {
      label: 'X (Twitter)',
      title: 'Share on X',
      className: 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
      icon: <XLogo className="h-4 w-4" />,
    },
    instagram: {
      label: 'Instagram',
      title: 'Share on Instagram',
      className: 'text-pink-600 hover:bg-pink-600 hover:text-white',
      icon: <InstagramLogo className="h-4 w-4" />,
    },
    copy: {
      label: 'Copy link',
      title: 'Copy link',
      className: 'hover:bg-primary-500 hover:text-white',
      icon: <LinkIcon className="h-4 w-4" />,
    },
    facebook: {
      label: 'Facebook',
      title: 'Share on Facebook',
      className: 'text-blue-600 hover:bg-blue-600 hover:text-white',
      icon: <FacebookLogo className="h-4 w-4" />,
    },
    pinterest: {
      label: 'Pinterest',
      title: 'Share on Pinterest',
      className: 'text-red-600 hover:bg-red-600 hover:text-white',
      icon: <PinterestLogo className="h-4 w-4" />,
    },
  };

  const handleShare = async (target: ShareTarget) => {
    const text = `${postTitle} - ${pageUrl}`;
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'share_clicked', { target });
    }

    if (target === 'copy') {
      try {
        await navigator.clipboard.writeText(pageUrl);
        showFeedback('Link copied');
      } catch {}
      return;
    }

    if (target === 'instagram') {
      try {
        await navigator.clipboard.writeText(text);
        showFeedback('Caption copied for Instagram');
      } catch {}
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      return;
    }

    const url =
      target === 'whatsapp'
        ? `https://wa.me/?text=${encodeURIComponent(text)}`
        : target === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`
        : target === 'pinterest'
        ? `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&description=${encodeURIComponent(postTitle)}&media=${encodeURIComponent(thumbnailUrl)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(pageUrl)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`rounded-2xl border border-white/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 ${className}`.trim()}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-surface-900 dark:text-white">
        <Share2 className="h-4 w-4 text-primary-500" /> Share
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {shareTargets.map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => handleShare(target)}
            className={`flex items-center justify-center rounded-xl bg-black/[0.04] p-2 dark:bg-white/[0.06] ${shareButtonMeta[target].className}`}
            title={shareButtonMeta[target].title}
            aria-label={shareButtonMeta[target].title}
          >
            {shareButtonMeta[target].icon}
          </button>
        ))}
      </div>
    </div>
  );
}
