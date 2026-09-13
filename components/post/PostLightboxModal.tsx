'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ToolBadge from '@/components/ToolBadge';
import { getToolInfo } from '@/lib/constants';
import { getThumbnailImageUrl } from '@/lib/image-url';

export interface LightboxState {
  images: string[];
  activeImageIndex: number;
  promptIndex: number;
  tools: string[];
}

export interface PostLightboxModalProps {
  state: LightboxState;
  postTitle: string;
  postId: string;
  settings?: any;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
}

export default function PostLightboxModal({
  state,
  postTitle,
  postId,
  settings,
  onClose,
  onNavigate,
}: PostLightboxModalProps) {
  const [activeIdx, setActiveIdx] = useState(state.activeImageIndex);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setActiveIdx(state.activeImageIndex);
  }, [state.activeImageIndex]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 130);
  }, [onClose]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIdx(index);
      if (onNavigate) onNavigate(index);
    },
    [onNavigate]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft' && state.images.length > 1) {
        goTo((activeIdx - 1 + state.images.length) % state.images.length);
      }
      if (e.key === 'ArrowRight' && state.images.length > 1) {
        goTo((activeIdx + 1) % state.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, goTo, activeIdx, state.images.length]);

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
    } catch {}
  };

  const currentUrl = state.images[activeIdx];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-6 cursor-zoom-out bg-black/90 backdrop-blur-[4px] select-none ${
        isClosing ? 'lightbox-backdrop-out pointer-events-none' : 'lightbox-backdrop-in'
      }`}
      onClick={handleClose}
    >
      {/* Top Bar (Floating Badges on left, Floating Glass Actions on right) */}
      <div className="w-full max-w-7xl flex items-center justify-between gap-2 z-50 pointer-events-none shrink-0 px-2 sm:px-4 py-2">
        <div className="flex items-center gap-1.5 pointer-events-auto min-w-0 overflow-x-auto no-scrollbar py-0.5">
          {state.tools.map((tool) => {
            const info = getToolInfo(tool, settings?.toolDetails);
            return (
              <ToolBadge
                key={tool}
                toolName={tool}
                toolInfo={info}
                size="sm"
                className="whitespace-nowrap shrink-0"
              />
            );
          })}
          <span className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/15 text-white backdrop-blur-xl border border-white/25 uppercase tracking-wider shadow-lg">
            {state.promptIndex >= 0 ? `Prompt #${state.promptIndex + 1}` : 'Reference'}
            {state.images.length > 1 && (
              <span className="text-white/80 font-normal ml-1">
                ({activeIdx + 1}/{state.images.length})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              if (currentUrl) {
                handleDownload(
                  currentUrl,
                  `prompt_${postId}_${state.promptIndex + 1}_v${activeIdx + 1}.png`
                );
              }
            }}
            className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-xl border border-white/30 hover:border-white/50 hover:scale-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            title="Download image"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-xl border border-white/30 hover:border-white/50 hover:scale-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            title="Close (Esc)"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Center Area — Fits image with zero cropping & zoom animation */}
      <div
        className={`relative w-full flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4 ${
          isClosing ? 'lightbox-content-out' : 'lightbox-content-in'
        }`}
        onClick={handleClose}
      >
        {/* Side Navigation Arrows (if multiple images) */}
        {state.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goTo((activeIdx - 1 + state.images.length) % state.images.length);
              }}
              className="absolute left-2 sm:left-4 z-50 p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-xl border border-white/30 hover:border-white/50 hover:scale-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              title="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goTo((activeIdx + 1) % state.images.length);
              }}
              className="absolute right-2 sm:right-4 z-50 p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-xl border border-white/30 hover:border-white/50 hover:scale-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              title="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {currentUrl && (
          <img
            src={currentUrl}
            alt={`${postTitle} full view`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl cursor-default"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Bottom Floating Thumbnails (if multiple images) */}
      {state.images.length > 1 ? (
        <div
          className="z-50 shrink-0 flex items-center gap-2 p-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl max-w-[90vw] overflow-x-auto no-scrollbar mb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {state.images.map((u, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative flex-none w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden transition-all ${
                i === activeIdx
                  ? 'ring-2 ring-primary-400 scale-105 opacity-100 shadow-xl'
                  : 'opacity-60 hover:opacity-100 scale-95 border border-white/30'
              }`}
            >
              <img
                src={getThumbnailImageUrl(u, { width: 100, quality: 65 })}
                alt={`Thumb ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-2" />
      )}
    </div>
  );
}
