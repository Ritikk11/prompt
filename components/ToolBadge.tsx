import Image from 'next/image';

// Single source of truth for the tool badge surface, used across the whole site
// (cards, every hero style, and the featured slider). Intentionally NOT tied to
// toolInfo.color so the badge stays legible on any background (white, dark, or
// colorful). Light glassmorphism (Apple-style): near-clear white fill + strong
// blur + saturate refracts the background, an inset white ring is the lit glass
// rim, and the text-shadow keeps the label readable even when the pill body goes
// faint over white posters. Tune the badge look here only.
export const BADGE_BG =
  'bg-white/15 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/30 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]';

type BadgeSize = 'sm' | 'md' | 'lg';

// Same glass design at every size — only padding / text / logo-chip scale change.
const SIZE = {
  sm: { pill: 'px-2.5 py-1 text-[9px] gap-1.5', logo: 'w-3.5 h-3.5 sm:w-4 sm:h-4' },
  md: { pill: 'px-3 py-1.5 text-xs gap-1.5', logo: 'w-4 h-4 sm:w-[18px] sm:h-[18px]' },
  lg: { pill: 'px-4 py-1.5 text-[11px] gap-2', logo: 'w-4.5 h-4.5 sm:w-5 sm:h-5' },
} as const;

export interface ToolBadgeProps {
  toolName: string;
  toolInfo: { logo?: string; logoScale?: number; color?: string } | null | undefined;
  size?: BadgeSize;
  className?: string;
}

export default function ToolBadge({ toolName, toolInfo, size = 'md', className = '' }: ToolBadgeProps) {
  const s = SIZE[size];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider text-white shadow-lg border border-white/10 ${BADGE_BG} ${s.pill} ${className}`}
    >
      {toolInfo?.logo ? (
        <span className={`relative shrink-0 ${s.logo} bg-white rounded-full overflow-hidden p-[2px] shadow-sm`}>
          <span
            className="relative block w-full h-full rounded-full overflow-hidden"
            style={toolInfo.logoScale ? { transform: `scale(${toolInfo.logoScale})` } : undefined}
          >
            <Image src={toolInfo.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
          </span>
        </span>
      ) : null}
      {toolName}
    </span>
  );
}
