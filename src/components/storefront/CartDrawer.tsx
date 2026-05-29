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
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white text-slate-900 z-[101] shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Xem trước giỏ hàng</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors p-2 -mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="px-6 py-4 text-sm text-slate-500 border-b bg-slate-50 flex justify-between items-center">
          <span>Xem chi tiết giỏ hàng</span>
          <span className="font-bold text-slate-700">{cartCount} sản phẩm</span>
        </div>

        {/* Upsell Banner (Chỉ hiện khi Flash Sale không chạy) */}
        {!isFlashSaleActive && nextTier && tierDiscountPercent === 0 && (
          <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-start gap-3">
             <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-0.5">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
               <p className="text-sm text-amber-800 font-medium">Mua thêm <span className="font-bold text-amber-600">{nextTier.minItems - cartCount}</span> video nữa để được giảm giá thêm <span className="font-bold text-red-500">{nextTier.discountPercent}%</span> tổng đơn hàng!</p>
             </div>
          </div>
        )}
        {!isFlashSaleActive && nextTier && tierDiscountPercent > 0 && (
          <div className="bg-green-50 px-6 py-3 border-b border-green-100 flex items-start gap-3">
             <div className="bg-green-100 p-2 rounded-full text-green-600 mt-0.5">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             </div>
             <div>
               <p className="text-sm text-green-800 font-medium">Tuyệt! Bạn đang được giảm <span className="font-bold text-green-600">{tierDiscountPercent}%</span>. Mua thêm <span className="font-bold text-amber-600">{nextTier.minItems - cartCount}</span> video nữa để nâng mức giảm lên <span className="font-bold text-red-500">{nextTier.discountPercent}%</span>!</p>
             </div>
          </div>
        )}
        {!isFlashSaleActive && !nextTier && tierDiscountPercent > 0 && (
          <div className="bg-green-50 px-6 py-3 border-b border-green-100 flex items-start gap-3">
             <div className="bg-green-100 p-2 rounded-full text-green-600 mt-0.5">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
               <p className="text-sm text-green-800 font-medium">Chúc mừng! Bạn đã đạt mức ưu đãi cao nhất, giảm <span className="font-bold text-red-500">{tierDiscountPercent}%</span> toàn đơn hàng!</p>
             </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {effectiveItems.map((item) => {
            const itemOriginalPrice = item.originalPrice || item.price;
            return (
            <div key={`${item.sku}-${item.format}`} className="flex flex-col gap-3 border rounded-xl p-4 relative bg-white shadow-sm hover:shadow-md transition-shadow">
               <div className="flex gap-4">
                 <img src={item.thumbnailUrl} alt={item.name} className="w-32 h-20 object-cover rounded-lg bg-slate-100" />
                 <div className="flex-1 flex flex-col justify-between">
                   <div className="flex justify-between items-start gap-2">
                     <div className="text-xl font-bold text-slate-900">{item.effectivePrice.toLocaleString('vi-VN')} đ</div>
                     {itemOriginalPrice > item.effectivePrice && (
                       <div className="text-xs text-slate-400 line-through">{itemOriginalPrice.toLocaleString('vi-VN')} đ</div>
                     )}
                   </div>
                   <div>
                     <div className="text-xs text-slate-400">Mã SKU: {item.sku}</div>
                     <div className="text-sm font-medium text-slate-700 mt-0.5 line-clamp-1">{item.name}</div>
                     <div className="text-xs font-medium text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">{item.format}</div>
                   </div>
                 </div>
               </div>
               
               <div className="flex justify-between items-center border-t border-dashed pt-3 mt-1">
                 <div className="text-xs text-slate-500 flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Giấy phép tiêu chuẩn
                 </div>
                 <button onClick={() => removeFromCart(item.sku, item.format)} className="text-blue-500 text-sm font-medium hover:text-blue-700 transition-colors">
                   Xóa
                 </button>
               </div>
            </div>
          )})}
          {effectiveItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg">Giỏ hàng trống.</p>
              <button onClick={() => setIsCartOpen(false)} className="mt-4 text-blue-500 font-medium hover:underline">
                Tiếp tục mua sắm
              </button>
            </div>
          )}
        </div>
        
        {effectiveItems.length > 0 && (
          <div className="p-6 border-t bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tổng giá sản phẩm gốc:</span>
                <span className="font-medium">{(baseTotal).toLocaleString('vi-VN')} đ</span>
              </div>
              
              {baseTotal > cartTotal && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-blue-50 p-3 rounded-lg text-blue-700 font-medium border border-blue-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                     <span>🎉 Khuyến mãi toàn sàn</span>
                     {globalDiscountEndMs && <GlobalCountdown endMs={globalDiscountEndMs} />}
                     <span className="text-[11px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
                        -{Math.round(((baseTotal - cartTotal) / baseTotal) * 100)}%
                     </span>
                  </div>
                  <span className="text-blue-600 font-bold self-end sm:self-auto shrink-0">-{(baseTotal - cartTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              
              {cartTotal > effectiveTotal && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-amber-50 p-3 rounded-lg text-amber-700 font-medium border border-amber-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                     <span>⚡ Trợ giá / Flash Sale</span>
                     <FlashSaleCountdown timeLeftMs={flashSaleTimeLeftMs} />
                     <span className="text-[11px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                        -{Math.round(((cartTotal - effectiveTotal) / cartTotal) * 100)}%
                     </span>
                  </div>
                  <span className="text-amber-600 font-bold self-end sm:self-auto shrink-0">-{(cartTotal - effectiveTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              
              {tierDiscountPercent > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-green-50 p-3 rounded-lg text-green-700 font-medium border border-green-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>📦 Ưu đãi Mua nhiều</span>
                    <span className="text-[11px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full shrink-0">
                      -{tierDiscountPercent}%
                    </span>
                  </div>
                  <span className="text-green-600 font-bold self-end sm:self-auto shrink-0">-{(effectiveTotal - finalTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              {baseTotal > finalTotal && (
                <div className="flex justify-between text-sm text-red-500 font-bold border-t border-dashed pt-3 mt-2">
                  <span>✨ Tổng tiền bạn tiết kiệm được:</span>
                  <span>-{(baseTotal - finalTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200">
              <span className="font-bold text-xl text-slate-800">Cần thanh toán:</span>
              <div className="text-right">
                 {baseTotal > finalTotal && (
                   <div className="text-sm text-slate-400 line-through mb-1">{(baseTotal).toLocaleString('vi-VN')} đ</div>
                 )}
                 <span className="font-extrabold text-2xl text-slate-900 text-red-500">{finalTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
            <Link 
              href="/checkout" 
              onClick={() => setIsCartOpen(false)} 
              className="block w-full py-4 bg-red-500 text-white text-center font-bold text-lg rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
            >
              Xem lại đơn hàng của tôi
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
