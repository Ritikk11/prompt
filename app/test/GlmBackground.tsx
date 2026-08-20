'use client';

import { useEffect, useState } from 'react';

export default function GlmBackground() {
  const [pos, setPos] = useState({ x: 50, y: 30 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05060f]">
      {/* Base radial wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(124,58,237,0.28),transparent_55%)]" />

      {/* Animated matrix grid */}
      <div
        className="absolute inset-0 opacity-[0.18] [animation:gridmove_18s_linear_infinite]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(110% 80% at 50% 0%, black 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(110% 80% at 50% 0%, black 30%, transparent 78%)',
        }}
      />

      {/* Floating glowing orbs */}
      <div className="absolute -top-32 -left-24 h-[34rem] w-[34rem] rounded-full bg-[#8b5cf6]/30 blur-[120px] [animation:floatOrb_9s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-28 h-[30rem] w-[30rem] rounded-full bg-[#e64bd6]/25 blur-[120px] [animation:floatOrb_13s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-[#2dd4bf]/20 blur-[120px] [animation:floatOrb_9s_ease-in-out_infinite]" />

      {/* Cursor spotlight */}
      <div
        className="absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(460px circle at ${pos.x}% ${pos.y}%, rgba(168,85,247,0.12), transparent 60%)`,
        }}
      />

      {/* Top sheen line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a855f7]/60 to-transparent" />

      {/* Inline styles for self-contained keyframe animations */}
      <style jsx>{`
        @keyframes gridmove {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 -560px;
          }
        }
        @keyframes floatOrb {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-22px) rotate(1.5deg);
          }
        }
      `}</style>
    </div>
  );
}
