import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGridClasses(mobileColumns: number = 2, desktopColumns: number = 4) {
  const mobile = mobileColumns === 1 ? 'columns-1' : 'columns-2';
  
  let desktop = 'md:columns-4 lg:columns-4 xl:columns-4';
  if (desktopColumns === 3) desktop = 'md:columns-3 lg:columns-3 xl:columns-3';
  if (desktopColumns === 4) desktop = 'md:columns-4 lg:columns-4 xl:columns-4';
  if (desktopColumns === 5) desktop = 'md:columns-3 lg:columns-4 xl:columns-5';
  if (desktopColumns === 6) desktop = 'md:columns-3 lg:columns-4 xl:columns-6';
  if (desktopColumns === 7) desktop = 'md:columns-4 lg:columns-5 xl:columns-7';
  if (desktopColumns === 8) desktop = 'md:columns-4 lg:columns-6 xl:columns-8';

  return `${mobile} ${desktop} gap-3 sm:gap-4`;
}

