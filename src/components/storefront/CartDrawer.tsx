'use client';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function GlobalCountdown({ endMs }: { endMs: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endMs - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, endMs - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (timeLeft <= 0) return null;

  const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeft / 1000 / 60) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  if (d > 0) return <span className="text-[10px] text-blue-600 font-mono bg-blue-100/50 px-1.5 py-0.5 rounded border border-blue-200">Còn {d}d {h}h</span>;
  return <span className="text-[10px] text-red-500 font-mono bg-red-100 px-1.5 py-0.5 rounded border border-red-200">Còn {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
}

function FlashSaleCountdown({ timeLeftMs }: { timeLeftMs: number }) {
  if (timeLeftMs <= 0) return null;

  const h = Math.floor((timeLeftMs / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeftMs / 1000 / 60) % 60);
  const s = Math.floor((timeLeftMs / 1000) % 60);

  return <span className="text-[10px] text-amber-700 font-mono bg-amber-200/50 px-1.5 py-0.5 rounded border border-amber-300/50">Còn {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
}

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, effectiveItems, removeFromCart, finalTotal, tierDiscountPercent, effectiveTotal, cartTotal, baseTotal, tiers, cartCount, isFlashSaleActive, flashSaleTimeLeftMs, globalDiscountEndMs } = useCart();

  // Tìm mức ưu đãi tiếp theo
  const nextTier = [...tiers].reverse().find(t => t.minItems > cartCount);

  // Prevent scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity" 
        onClick={() => setIsCartOpen(false)} 
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white text-slate-900 z-[101] shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header - compact */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="text-lg font-bold">Xem trước giỏ hàng</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">{cartCount} sản phẩm</span>
            <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Upsell Banner - single line */}
        {nextTier && (
          <div className={`px-4 py-2 border-b text-[11px] font-medium shrink-0 ${tierDiscountPercent > 0 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            {tierDiscountPercent === 0 ? (
              <>💡 Mua thêm <span className="font-bold">{nextTier.minItems - cartCount}</span> video → giảm thêm <span className="font-bold text-red-500">{nextTier.discountPercent}%</span></>
            ) : (
              <>✅ Đang giảm <span className="font-bold">{tierDiscountPercent}%</span> · Thêm <span className="font-bold">{nextTier.minItems - cartCount}</span> video → <span className="font-bold text-red-500">{nextTier.discountPercent}%</span></>
            )}
          </div>
        )}
        {!nextTier && tierDiscountPercent > 0 && (
          <div className="px-4 py-2 border-b text-[11px] font-medium shrink-0 bg-green-50 border-green-100 text-green-700">
            🎉 Mức ưu đãi cao nhất: giảm <span className="font-bold text-red-500">{tierDiscountPercent}%</span> toàn đơn!
          </div>
        )}
        
        {/* Cart Items List - ultra compact single-row layout */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
          {effectiveItems.map((item) => {
            const itemOriginalPrice = item.originalPrice || item.price;
            return (
              <div key={`${item.sku}-${item.format}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50/80 transition-colors">
                {/* Thumbnail - small square */}
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.name} 
                  className="w-12 h-12 object-cover rounded-lg bg-slate-100 shrink-0" 
                />
                
                {/* Info block - name + format on one line area */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-slate-800 truncate leading-tight">{item.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 py-px rounded">{item.format}</span>
                    <span className="text-[9px] text-slate-400 truncate">SKU: {item.sku}</span>
                  </div>
                </div>

                {/* Price block */}
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold text-slate-900 leading-tight whitespace-nowrap">{item.effectivePrice.toLocaleString('vi-VN')}đ</div>
                  {itemOriginalPrice > item.effectivePrice && (
                    <div className="text-[10px] text-slate-400 line-through leading-tight whitespace-nowrap">{itemOriginalPrice.toLocaleString('vi-VN')}đ</div>
                  )}
                </div>

                {/* Delete button - minimal */}
                <button 
                  onClick={() => removeFromCart(item.sku, item.format)} 
                  className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0 -mr-1"
                  title="Xóa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
          {effectiveItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">Giỏ hàng trống.</p>
              <button onClick={() => setIsCartOpen(false)} className="mt-3 text-blue-500 text-sm font-medium hover:underline">
                Tiếp tục mua sắm
              </button>
            </div>
          )}
        </div>
        
        {/* Footer - compact summary */}
        {effectiveItems.length > 0 && (
          <div className="px-4 py-3 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] shrink-0 z-10">
            {/* Discount lines - ultra compact */}
            <div className="space-y-1.5 mb-2.5">
              {/* Original total */}
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Giá gốc:</span>
                <span>{baseTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              
              {/* Global discount */}
              {baseTotal > cartTotal && (
                <div className="flex items-center justify-between text-[11px] text-blue-600 font-medium">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">🎉 KM toàn sàn</span>
                    {globalDiscountEndMs && <GlobalCountdown endMs={globalDiscountEndMs} />}
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-px rounded-full shrink-0">-{Math.round(((baseTotal - cartTotal) / baseTotal) * 100)}%</span>
                  </div>
                  <span className="font-bold shrink-0 ml-2">-{(baseTotal - cartTotal).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              
              {/* Flash Sale */}
              {cartTotal > effectiveTotal && (
                <div className="flex items-center justify-between text-[11px] text-amber-600 font-medium">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">⚡ Flash Sale</span>
                    <FlashSaleCountdown timeLeftMs={flashSaleTimeLeftMs} />
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-px rounded-full shrink-0">-{Math.round(((cartTotal - effectiveTotal) / cartTotal) * 100)}%</span>
                  </div>
                  <span className="font-bold shrink-0 ml-2">-{(cartTotal - effectiveTotal).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              
              {/* Tier discount */}
              {tierDiscountPercent > 0 && (
                <div className="flex items-center justify-between text-[11px] text-green-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>📦 Mua nhiều</span>
                    <span className="text-[9px] bg-green-100 text-green-700 px-1 py-px rounded-full">-{tierDiscountPercent}%</span>
                  </div>
                  <span className="font-bold shrink-0">-{(effectiveTotal - finalTotal).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              {/* Total saved */}
              {baseTotal > finalTotal && (
                <div className="flex justify-between text-[11px] text-red-500 font-bold border-t border-dashed pt-1.5 mt-1">
                  <span>✨ Tiết kiệm:</span>
                  <span>-{(baseTotal - finalTotal).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>
            
            {/* Total to pay */}
            <div className="flex justify-between items-center mb-3 pt-2.5 border-t border-slate-200">
              <span className="font-bold text-sm text-slate-700">Cần thanh toán:</span>
              <div className="text-right">
                 {baseTotal > finalTotal && (
                   <div className="text-[11px] text-slate-400 line-through leading-none mb-0.5">{baseTotal.toLocaleString('vi-VN')}đ</div>
                 )}
                 <span className="font-extrabold text-xl text-red-500 leading-none">{finalTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
            <Link 
              href="/checkout" 
              onClick={() => setIsCartOpen(false)} 
              className="block w-full py-3 bg-red-500 text-white text-center font-bold text-[15px] rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
            >
              Xem lại đơn hàng của tôi
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
