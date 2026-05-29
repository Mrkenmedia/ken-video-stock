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

  if (d > 0) return <span className="text-[10px] text-blue-400 font-mono bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-800">Còn {d}d {h}h</span>;
  return <span className="text-[10px] text-red-400 font-mono bg-red-900/50 px-1.5 py-0.5 rounded border border-red-800">Còn {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
}

function FlashSaleCountdown({ timeLeftMs }: { timeLeftMs: number }) {
  if (timeLeftMs <= 0) return null;

  const h = Math.floor((timeLeftMs / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeftMs / 1000 / 60) % 60);
  const s = Math.floor((timeLeftMs / 1000) % 60);

  return <span className="text-[10px] text-amber-400 font-mono bg-amber-900/50 px-1.5 py-0.5 rounded border border-amber-800/50">Còn {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
}

export default function CartPage() {
  const { effectiveItems, removeFromCart, effectiveTotal, tierDiscountPercent, finalTotal, cartTotal, baseTotal, isFlashSaleActive, flashSaleTimeLeftMs, globalDiscountEndMs } = useCart();

  if (effectiveItems.length === 0) {
    return (
      <div className="container mx-auto px-6 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <svg className="w-24 h-24 text-slate-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <h1 className="text-3xl font-bold text-white mb-4">Giỏ hàng trống</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Bạn chưa chọn sản phẩm nào vào giỏ hàng. Khám phá kho video chất lượng cao ngay nhé!</p>
        <Link href="/" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-4 rounded-xl transition-all">
          Khám phá Video
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-8">Giỏ hàng của bạn</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Danh sách sản phẩm */}
        <div className="lg:col-span-2 space-y-4">
          {effectiveItems.map((item) => {
            const itemOriginalPrice = item.originalPrice || item.price;
            return (
            <div key={`${item.sku}-${item.format}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center">
              {item.thumbnailUrl && (
                <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <Link href={`/${item.sku}`} className="text-white font-semibold hover:text-cyan-400 transition-colors line-clamp-1">
                  {item.name}
                </Link>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">{item.sku}</span>
                  <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded">{item.format}</span>
                </div>
              </div>
              <div className="text-right shrink-0 pr-4">
                <p className="text-cyan-400 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.effectivePrice)}</p>
                {itemOriginalPrice > item.effectivePrice && (
                  <p className="text-[11px] text-slate-500 line-through">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemOriginalPrice)}</p>
                )}
              </div>
              <button 
                onClick={() => removeFromCart(item.sku, item.format)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                title="Xóa khỏi giỏ hàng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )})}
        </div>

        {/* Tổng thanh toán */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Tổng giá sản phẩm gốc</span>
                <span className="text-white">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal)}</span>
              </div>
              
              {/* Global Discount */}
              {baseTotal > cartTotal && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-blue-50/10 p-3 rounded-lg text-blue-400 font-medium border border-blue-500/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                     <span>🎉 Khuyến mãi toàn sàn</span>
                     {globalDiscountEndMs && <GlobalCountdown endMs={globalDiscountEndMs} />}
                     <span className="text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full shrink-0">
                        -{Math.round(((baseTotal - cartTotal) / baseTotal) * 100)}%
                     </span>
                  </div>
                  <span className="text-blue-400 font-bold self-end sm:self-auto shrink-0">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal - cartTotal)}
                  </span>
                </div>
              )}
              
              {/* Flash Sale Discount */}
              {cartTotal > effectiveTotal && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-amber-50/10 p-3 rounded-lg text-amber-400 font-medium border border-amber-500/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                     <span>⚡ Trợ giá / Flash Sale</span>
                     <FlashSaleCountdown timeLeftMs={flashSaleTimeLeftMs} />
                     <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                        -{Math.round(((cartTotal - effectiveTotal) / cartTotal) * 100)}%
                     </span>
                  </div>
                  <span className="text-amber-400 font-bold self-end sm:self-auto shrink-0">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal - effectiveTotal)}
                  </span>
                </div>
              )}

              {tierDiscountPercent > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-green-50/10 p-3 rounded-lg text-green-400 font-medium border border-green-500/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>📦 Ưu đãi mua nhiều</span>
                    <span className="text-[11px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full shrink-0">
                      -{tierDiscountPercent}%
                    </span>
                  </div>
                  <span className="text-green-400 font-bold self-end sm:self-auto shrink-0">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(effectiveTotal - finalTotal)}
                  </span>
                </div>
              )}

              {/* Total savings */}
              {baseTotal > finalTotal && (
                <div className="flex justify-between text-sm text-red-400 font-bold border-t border-slate-800 border-dashed pt-3 mt-2">
                  <span>✨ Tổng tiền bạn tiết kiệm được:</span>
                  <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal - finalTotal)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-6 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Tổng thanh toán</span>
                <div className="text-right">
                  {baseTotal > finalTotal && (
                    <div className="text-sm text-slate-500 line-through mb-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal)}</div>
                  )}
                  <span className="text-3xl font-bold text-cyan-400">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              Tiến hành Thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
