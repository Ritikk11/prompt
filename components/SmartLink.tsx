import Link from '@/components/PrefetchLink';
import type { ReactNode } from 'react';

export default function SmartLink({ href, className, children, onClick }: { href: string; className?: string; children: ReactNode; onClick?: () => void }) {
  const isExternal = /^https?:\/\//i.test(href);

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href || '/'} prefetch={true} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
