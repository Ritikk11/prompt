import Image from 'next/image';
import { Compass } from 'lucide-react';
import type { ReactNode } from 'react';

type DiscoveryLogoIcon = { logo?: string; label: string; logoScale?: number };

function isDiscoveryLogoIcon(icon: ReactNode | DiscoveryLogoIcon | undefined): icon is DiscoveryLogoIcon {
  return Boolean(icon && typeof icon === 'object' && 'label' in icon);
}

export default function DiscoveryPageHero({
  badge,
  title,
  description,
  stats = [],
  icon,
}: {
  badge: string;
  title: string;
  description: string;
  stats?: { label: string; value: string | number }[];
  icon?: ReactNode | DiscoveryLogoIcon;
}) {
  const logoIcon = isDiscoveryLogoIcon(icon) ? icon : null;
  const nodeIcon: ReactNode | null = logoIcon ? null : (icon as ReactNode | undefined) || null;

  return (
    /* glass-surface + an explicit radius: glass-card's rounded-2xl is unlayered
       and would override the 30px corner. */
    <section className="glass-surface relative mb-8 overflow-hidden rounded-[30px] px-5 py-10 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)] sm:px-8 lg:px-10">
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-black text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/[0.14] dark:text-primary-200">
            {logoIcon?.logo ? (
              <span className="relative h-5 w-5 overflow-hidden rounded-full bg-white" style={logoIcon.logoScale ? { transform: `scale(${logoIcon.logoScale})` } : undefined}>
                <Image src={logoIcon.logo} alt={`${logoIcon.label} logo`} width={20} height={20} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
              </span>
            ) : nodeIcon ? (
              nodeIcon
            ) : (
              <Compass className="h-4 w-4" />
            )}
            {badge}
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-surface-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
            {description}
          </p>
        </div>
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:flex">
            {stats.map(stat => (
              /* A tint, not a second frost: glass inside glass costs another
                 full-size blur pass for no visible gain. */
              <div key={stat.label} className="rounded-2xl border border-white/60 bg-white/40 px-5 py-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-black text-surface-950 dark:text-white">{stat.value}</p>
                <p className="mt-1 text-xs font-bold text-surface-500 dark:text-surface-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function defaultDiscoveryIcon() {
  return <Compass className="h-4 w-4" />;
}
