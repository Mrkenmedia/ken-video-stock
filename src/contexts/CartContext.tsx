'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFlashSale } from '@/hooks/useFlashSale';

export interface CartItem {
  sku: string;
  name: string;
  format: 'MP4' | 'MOV';
  /** Giá trị từ Google Sheets sau khi đã áp Khuyến mãi toàn sàn */
  price: number;
  /** Giá trị gốc không qua bất kỳ chiết khấu nào */
  originalPrice?: number;
  thumbnailUrl: string;
}

/** CartItem kèm giá hiệu lực (đã áp Flash Sale nếu có) */
export interface EffectiveCartItem extends CartItem {
  effectivePrice: number;
}

interface CartContextType {
  items: CartItem[];
  /** Items với giá hiệu lực theo Flash Sale hiện tại */
  effectiveItems: EffectiveCartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (sku: string, format: 'MP4' | 'MOV') => void;
  clearCart: () => void;
  /** Tổng giá sau khi áp Khuyến mãi toàn sàn (chưa Flash sale, chưa Tier) */
  cartTotal: number;
  /** Tổng giá gốc tuyệt đối (chưa giảm bất kỳ cái gì) */
  baseTotal: number;
  /** Tổng sau Flash Sale (chưa tier) */
  effectiveTotal: number;
  cartCount: number;
  tierDiscountPercent: number;
  /** Tổng cuối: effectiveTotal sau tier discount */
  finalTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isFlashSaleActive: boolean;
  flashSaleTimeLeftMs: number;
  globalDiscountEndMs: number | null;
  tiers: { minItems: number; discountPercent: number }[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tiers, setTiers] = useState<{ minItems: number; discountPercent: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [globalDiscountEndMs, setGlobalDiscountEndMs] = useState<number | null>(null);

  // Flash sale được đọc live — khi sale bắt đầu/kết thúc, giá tự cập nhật
  const { isFlashSaleActive, flashSalePercent, timeLeftMs: flashSaleTimeLeftMs } = useFlashSale();

  useEffect(() => {
    const savedCart = localStorage.getItem('ken_cart');
    let initialItems: CartItem[] = [];
    if (savedCart) {
      try { 
        initialItems = JSON.parse(savedCart);
        setItems(initialItems); 
      } catch (e) {}
    }
    setIsLoaded(true);

    fetch('/api/tiers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTiers(data); })
      .catch(e => console.error('Tiers fetch error', e));

    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.globalDiscountEnd) {
          const endStr = data.globalDiscountEnd;
          const endMs = new Date(endStr.includes('+') ? endStr : endStr + '+07:00').getTime();
          setGlobalDiscountEndMs(endMs);
        } else {
          // Giả sử có cấu hình mặc định C.endDate nếu cần, nhưng tạm thời để null
          setGlobalDiscountEndMs(null);
        }
      })
      .catch(e => console.error('Settings fetch error', e));

    // Đồng bộ giá ngay lần đầu load
    if (initialItems.length > 0) {
      syncPricesWithServer();
    }
  }, []);

  const syncPricesWithServer = () => {
    fetch('/api/products')
      .then(r => r.json())
      .then(latestProducts => {
        if (Array.isArray(latestProducts)) {
          setItems(prevItems => {
            let hasChanges = false;
            const newItems = prevItems.map(item => {
              const matched = latestProducts.find(p => p.sku === item.sku);
              if (matched) {
                const newPrice = item.format === 'MOV' ? matched.priceMov : matched.priceMp4;
                const newOrigPrice = item.format === 'MOV' ? matched.originalPriceMov : matched.originalPriceMp4;
                
                if (newPrice !== item.price || newOrigPrice !== item.originalPrice) {
                  hasChanges = true;
                  return { ...item, price: newPrice, originalPrice: newOrigPrice || newPrice };
                }
              }
              return item;
            });
            return hasChanges ? newItems : prevItems;
          });
        }
      })
      .catch(e => console.error('Failed to sync cart prices with server:', e));
  };

  // Đồng bộ giá liên tục (real-time) mỗi 30 giây nếu giỏ hàng có sản phẩm
  useEffect(() => {
    if (items.length === 0 || !isLoaded) return;
    const interval = setInterval(syncPricesWithServer, 30000);
    return () => clearInterval(interval);
  }, [items.length, isLoaded]);

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

  const clearCart = () => setItems([]);

  /** Áp Flash Sale lên giá gốc */
  const applyFlashSale = (basePrice: number): number => {
    if (isFlashSaleActive && flashSalePercent > 0) {
      return Math.round((basePrice * (1 - flashSalePercent / 100)) / 1000) * 1000;
    }
    return basePrice;
  };

  const effectiveItems: EffectiveCartItem[] = items.map(item => ({
    ...item,
    effectivePrice: applyFlashSale(item.price),
  }));

  const cartTotal = items.reduce((sum, item) => sum + item.price, 0);
  const baseTotal = items.reduce((sum, item) => sum + (item.originalPrice || item.price), 0);
  const effectiveTotal = effectiveItems.reduce((sum, item) => sum + item.effectivePrice, 0);
  const cartCount = items.length;

  // Tier discount áp trên effectiveTotal (sau flash sale, CHỈ khi không có Flash Sale hoạt động)
  const activeTier = (!isFlashSaleActive && tiers.length > 0) ? tiers.find(t => cartCount >= t.minItems) : undefined;
  const tierDiscountPercent = activeTier ? activeTier.discountPercent : 0;
  const finalTotal = Math.round(effectiveTotal * (1 - tierDiscountPercent / 100));

  return (
    <CartContext.Provider value={{
      items,
      effectiveItems,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      baseTotal,
      effectiveTotal,
      cartCount,
      tierDiscountPercent,
      finalTotal,
      isCartOpen,
      setIsCartOpen,
      isFlashSaleActive,
      flashSaleTimeLeftMs,
      globalDiscountEndMs,
      tiers,
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
