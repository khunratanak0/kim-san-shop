'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  hidePrice: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, variantName: string) => void;
  updateQuantity: (id: string, variantName: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kimsan_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
    setHydrated(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('kimsan_cart', JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addToCart = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.id === newItem.id && item.variantName === newItem.variantName
      );

      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id && item.variantName === newItem.variantName
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }

      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string, variantName: string) => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.variantName === variantName)));
  };

  const updateQuantity = (id: string, variantName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, variantName);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.variantName === variantName
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.hidePrice ? 0 : item.price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
