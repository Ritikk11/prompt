import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGridClasses(mobileColumns: number = 2, desktopColumns: number = 4) {
  const mobile = mobileColumns === 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2';
  
  let desktop = 'lg:grid-cols-3 xl:grid-cols-4';
  if (desktopColumns === 3) desktop = 'lg:grid-cols-2 xl:grid-cols-3';
  if (desktopColumns === 4) desktop = 'lg:grid-cols-3 xl:grid-cols-4';
  if (desktopColumns === 5) desktop = 'lg:grid-cols-4 xl:grid-cols-5';
  if (desktopColumns === 6) desktop = 'lg:grid-cols-5 xl:grid-cols-6';
  if (desktopColumns === 7) desktop = 'lg:grid-cols-6 xl:grid-cols-7';
  if (desktopColumns === 8) desktop = 'lg:grid-cols-6 xl:grid-cols-8';

  return `grid ${mobile} md:grid-cols-3 ${desktop} gap-2 sm:gap-3 items-start`;
}

