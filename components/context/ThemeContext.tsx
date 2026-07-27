'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '@/lib/types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pv-theme');
    if (stored === 'light' || stored === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    }
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('pv-theme', next);
      return next;
    });
  };

  // To prevent the sun/moon icon from flashing initially if we want, we could use isMounted check in a component,
  // but to fix hydration mismatch, ensuring it matches the server's initial render is exactly what we need.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
