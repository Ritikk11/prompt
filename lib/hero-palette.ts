import type { HeroPalette } from './types';

export const DEFAULT_HERO_PALETTE: HeroPalette = {
  primary: '#6366f1',
  secondary: '#0ea5e9',
  background: '#080d1d',
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function sanitizeHeroPalette(value: unknown): HeroPalette | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const palette = value as Partial<HeroPalette>;
  if (![palette.primary, palette.secondary, palette.background].every(color => typeof color === 'string' && HEX_COLOR.test(color))) {
    return undefined;
  }
  return {
    primary: palette.primary!.toLowerCase(),
    secondary: palette.secondary!.toLowerCase(),
    background: palette.background!.toLowerCase(),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function buildHeroGradient(value: unknown) {
  const palette = sanitizeHeroPalette(value) || DEFAULT_HERO_PALETTE;
  return `radial-gradient(circle at 18% 20%, ${hexToRgba(palette.primary, 0.48)}, transparent 44%), radial-gradient(circle at 82% 16%, ${hexToRgba(palette.secondary, 0.38)}, transparent 40%), linear-gradient(135deg, ${palette.background} 0%, #080d1d 58%, #020617 100%)`;
}
