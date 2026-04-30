'use client';

import React, { useEffect, useRef } from 'react';
import { useData } from '@/components/context/DataContext';

interface AdSlotProps {
  placement: 'header' | 'inFeed' | 'postTop' | 'postBottom';
  className?: string;
  inFeedIndex?: number;
}

export default function AdSlot({ placement, className = '', inFeedIndex }: AdSlotProps) {
  const { settings } = useData();
  const adRef = useRef<HTMLDivElement>(null);
  
  const adConfig = settings?.ads?.[placement];
  
  useEffect(() => {
    if (!adConfig?.enabled || !adConfig.code || !adRef.current) return;
    
    // For inFeed ads, only show at specified frequency
    if (placement === 'inFeed' && inFeedIndex !== undefined) {
      const frequency = settings?.ads?.inFeed?.frequency || 6;
      if ((inFeedIndex + 1) % frequency !== 0) return;
    }

    try {
      const range = document.createRange();
      range.selectNode(document.body);
      const documentFragment = range.createContextualFragment(adConfig.code);
      
      adRef.current.innerHTML = '';
      adRef.current.appendChild(documentFragment);
    } catch (e) {
      console.warn('Failed to inject ad code', e);
      // Fallback
      if (adRef.current) {
        adRef.current.innerHTML = adConfig.code;
      }
    }
  }, [adConfig, placement, inFeedIndex, settings?.ads?.inFeed?.frequency]);

  if (!adConfig?.enabled || !adConfig.code) {
    if (process.env.NODE_ENV === 'development') {
        // Return null instead of a placeholder in dev by default, or maybe placeholder
    }
    return null;
  }
  
  if (placement === 'inFeed' && inFeedIndex !== undefined) {
    const frequency = settings?.ads?.inFeed?.frequency || 6;
    if ((inFeedIndex + 1) % frequency !== 0) return null;
  }

  return (
    <div className={`ad-container flex justify-center items-center overflow-hidden my-4 ${className}`} ref={adRef}>
      {/* Ad code will be injected here */}
    </div>
  );
}
