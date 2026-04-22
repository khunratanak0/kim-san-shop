'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Header({ storeName }: { storeName: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-100/50 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80 transition-colors duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-orange-50 dark:bg-stone-800 p-2.5 rounded-2xl group-hover:bg-orange-100 dark:group-hover:bg-stone-700 transition-all duration-300">
            <ShoppingBag className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-stone-800 dark:text-stone-100">
            {storeName || "KIM SAN SHOP"}
          </span>
        </Link>
        
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-orange-50 text-orange-400 hover:bg-orange-100 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white transition-all duration-300"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}