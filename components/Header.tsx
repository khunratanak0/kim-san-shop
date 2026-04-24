'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  logoSize?: number;
  logoOffsetY?: number;
  lang: string;
  toggleLang: () => void;
}

export default function Header({
  storeName,
  logoUrl,
  logoSize = 48,
  logoOffsetY = 0,
  lang,
  toggleLang,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-100/50 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 min-h-20 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 group min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${storeName} Logo`}
              style={{ height: `${logoSize}px`, transform: `translateY(${logoOffsetY}px)` }}
              className="object-contain w-auto max-w-[56px] sm:max-w-none group-hover:scale-105 transition-transform duration-300 rounded-lg shrink-0"
            />
          ) : (
            <div className="bg-orange-50 dark:bg-stone-800 p-2.5 rounded-2xl group-hover:bg-orange-100 dark:group-hover:bg-stone-700 transition-all duration-300 shrink-0">
              <ShoppingBag className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
          )}

          <span className="font-extrabold text-base sm:text-xl tracking-tight text-stone-800 dark:text-stone-100 uppercase truncate">
            {storeName || 'KIM SAN SHOP'}
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {mounted && (
            <button
              onClick={toggleLang}
              className="relative overflow-hidden w-10 h-10 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 transition-all duration-300 flex items-center justify-center font-extrabold text-sm"
              aria-label="Toggle Language"
            >
              <span className={`absolute transition-all duration-500 ${lang === 'en' ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-75'}`}>
                EN
              </span>
              <span className={`absolute transition-all duration-500 ${lang === 'kh' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>
                KH
              </span>
            </button>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-orange-50 text-orange-400 hover:bg-orange-100 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white transition-all duration-300"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}