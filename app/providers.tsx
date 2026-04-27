'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/lib/cartContext';
import CartModal from '@/components/CartModal';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // BULLETPROOF BACK BUTTON FIX:
  // Next.js soft-routing caches the body state. This hook watches the actual URL route.
  // Every time you navigate (e.g., hitting the back button from /admin to /), 
  // it forcefully strips away any stuck scroll locks.
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }, [pathname]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="theme"
    >
      <CartProvider>
        {children}
        <CartModal />
      </CartProvider>
    </ThemeProvider>
  );
}