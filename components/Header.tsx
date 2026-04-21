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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 transition-colors duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <ShoppingBag className="w-6 h-6 text-gray-900 dark:text-white group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-xl tracking-tight text-gray-900 dark:text-white">
            {storeName || "KIM SAN SHOP"}
          </span>
        </Link>
        
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gray-300 hover:text-white" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 hover:text-gray-900" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}