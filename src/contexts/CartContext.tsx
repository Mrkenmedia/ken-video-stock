'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  sku: string;
  name: string;
  format: 'MP4' | 'MOV';
  price: number;
  thumbnailUrl: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (sku: string, format: 'MP4' | 'MOV') => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  tierDiscountPercent: number;
  finalTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tiers, setTiers] = useState<{ minItems: number; discountPercent: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('ken_cart');
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)); } catch (e) {}
    }
    setIsLoaded(true);

    // Fetch tiers rules
    fetch('/api/tiers')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTiers(data);
      })
      .catch(e => console.error('Tiers fetch error', e));
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ken_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some(i => i.sku === item.sku && i.format === item.format);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (sku: string, format: 'MP4' | 'MOV') => {
    setItems((prev) => prev.filter(i => !(i.sku === sku && i.format === format)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce((sum, item) => sum + item.price, 0);
  const cartCount = items.length;

  // Calculate Tier Discount
  const activeTier = tiers.find(t => cartCount >= t.minItems);
  const tierDiscountPercent = activeTier ? activeTier.discountPercent : 0;
  const finalTotal = Math.round(cartTotal * (1 - tierDiscountPercent / 100));

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      cartTotal, 
      cartCount,
      tierDiscountPercent,
      finalTotal,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
