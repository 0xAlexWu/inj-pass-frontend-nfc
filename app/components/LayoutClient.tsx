'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TunnelBackground from '@/components/TunnelBackground';
import {
  applyThemeMode,
  resolveThemeMode,
  type ThemeMode,
} from '@/utils/theme';

export function SidebarOverlay() {
  const handleClick = () => {
    document.body.classList.toggle('sidebar-mode');
  };

  return <div className="sidebar-overlay" onClick={handleClick}></div>;
}

export function GeometricShapes() {
  const pathname = usePathname();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncTheme = () => {
      const { mode } = resolveThemeMode(window.localStorage);
      setThemeMode(mode);
      applyThemeMode(mode);
    };

    syncTheme();
    window.addEventListener('storage', syncTheme);
    window.addEventListener('focus', syncTheme);

    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('focus', syncTheme);
    };
  }, []);

  if (pathname === '/welcome') {
    return null;
  }

  return (
    <>
      <TunnelBackground mode={themeMode} className="fixed inset-0 -z-10" />
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          background:
            themeMode === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(237,241,247,0.3) 100%)'
              : 'linear-gradient(180deg, rgba(2,2,2,0.08) 0%, rgba(2,2,2,0.18) 100%)',
        }}
      />
    </>
  );
}
