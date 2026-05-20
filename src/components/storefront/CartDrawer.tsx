'use client';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, effectiveItems, removeFromCart, finalTotal, tierDiscountPercent, effectiveTotal, cartTotal } = useCart();

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
        
        <div className="px-6 py-4 text-sm text-slate-500 border-b bg-slate-50">Xem chi tiết giỏ hàng</div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {effectiveItems.map((item) => (
            <div key={`${item.sku}-${item.format}`} className="flex flex-col gap-3 border rounded-xl p-4 relative bg-white shadow-sm hover:shadow-md transition-shadow">
               <div className="flex gap-4">
                 <img src={item.thumbnailUrl} alt={item.name} className="w-32 h-20 object-cover rounded-lg bg-slate-100" />
                 <div className="flex-1 flex flex-col justify-between">
                   <div className="flex justify-between items-start gap-2">
                     <div className="text-xl font-bold text-slate-900">{item.effectivePrice.toLocaleString('vi-VN')} đ</div>
                     {item.effectivePrice < item.price && (
                       <div className="text-xs text-slate-400 line-through">{item.price.toLocaleString('vi-VN')} đ</div>
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
          ))}
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
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tạm tính:</span>
                <span>{(cartTotal).toLocaleString('vi-VN')} đ</span>
              </div>
              {cartTotal > effectiveTotal && (
                <div className="flex justify-between text-sm text-amber-500 font-medium">
                  <span>⚡ Ưu đãi Flash Sale:</span>
                  <span>-{(cartTotal - effectiveTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              {tierDiscountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>📦 Ưu đãi mua nhiều (-{tierDiscountPercent}%):</span>
                  <span>-{(effectiveTotal - finalTotal).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-6 pt-3 border-t border-slate-100">
              <span className="font-bold text-xl text-slate-800">Tổng phụ:</span>
              <span className="font-extrabold text-2xl text-slate-900">{finalTotal.toLocaleString('vi-VN')} đ</span>
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
