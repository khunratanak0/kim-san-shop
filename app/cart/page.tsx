'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home since cart is now a modal overlay
    router.push('/');
  }, [router]);

  return null;
}