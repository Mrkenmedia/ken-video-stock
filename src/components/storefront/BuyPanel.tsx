'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCart } from '@/contexts/CartContext';
import { useFlashSale } from '@/hooks/useFlashSale';

interface BuyPanelProps {
  sku: string;
  name: string;
  thumbnailUrl: string;
  priceMp4: number;
  priceMov: number;
  hasMp4?: boolean;
  hasMov?: boolean;
  originalPriceMp4?: number;
  originalPriceMov?: number;
}

export default function BuyPanel({ 
  sku, 
  name, 
  thumbnailUrl, 
  priceMp4, 
  priceMov, 
  hasMp4 = true, 
  hasMov = true,
  originalPriceMp4,
  originalPriceMov
}: BuyPanelProps) {
  const router = useRouter();
  const { isFlashSaleActive, flashSalePercent } = useFlashSale();

  const getPrice = (basePrice: number) => {
    if (isFlashSaleActive && flashSalePercent > 0) {
      return Math.round((basePrice * (1 - flashSalePercent / 100)) / 1000) * 1000;
    }
    return basePrice;
  };

  const finalPriceMp4 = getPrice(priceMp4);
  const finalPriceMov = getPrice(priceMov);
  const finalOriginalPriceMp4 = isFlashSaleActive ? priceMp4 : originalPriceMp4;
  const finalOriginalPriceMov = isFlashSaleActive ? priceMov : originalPriceMov;

  const [format, setFormat] = useState<'MP4' | 'MOV'>(
    (finalPriceMp4 > 0 && hasMp4) ? 'MP4' : 'MOV'
  );
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const currentPrice = format === 'MOV' ? finalPriceMov : finalPriceMp4;

  const handleAddToCart = () => {
    addToCart({
      sku,
      name,
      format,
      price: currentPrice,
      thumbnailUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({
      sku,
      name,
      format,
      price: currentPrice,
      thumbnailUrl,
    });
    router.push('/checkout');
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        Chọn định dạng mua
      </h2>

      <div className="space-y-3 mb-6">
        {/* MP4 Option */}
        {finalPriceMp4 > 0 && hasMp4 && (
          <label
            className={`relative flex cursor-pointer rounded-2xl border p-4 transition-all ${
              format === 'MP4'
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="MP4"
              className="sr-only"
              checked={format === 'MP4'}
              onChange={() => setFormat('MP4')}
            />
             <div className="flex w-full items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">Định dạng MP4</p>
                <p className="text-[10px] text-slate-500">Tối ưu cho Web & MXH</p>
              </div>
              <div className="text-right">
                {finalOriginalPriceMp4 && finalOriginalPriceMp4 > finalPriceMp4 ? (
                  <p className="text-xs text-slate-500 line-through mb-0.5">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalOriginalPriceMp4)}
                  </p>
                ) : null}
                <p className="font-bold text-cyan-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPriceMp4)}
                </p>
              </div>
            </div>
          </label>
        )}

        {/* MOV Option */}
        {finalPriceMov > 0 && hasMov && (
          <label
            className={`relative flex cursor-pointer rounded-2xl border p-4 transition-all ${
              format === 'MOV'
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="MOV"
              className="sr-only"
              checked={format === 'MOV'}
              onChange={() => setFormat('MOV')}
            />
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">Định dạng MOV</p>
                <p className="text-[10px] text-slate-500">File gốc Alpha/ProRes</p>
              </div>
              <div className="text-right">
                {finalOriginalPriceMov && finalOriginalPriceMov > finalPriceMov ? (
                  <p className="text-xs text-slate-500 line-through mb-0.5">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalOriginalPriceMov)}
                  </p>
                ) : null}
                <p className="font-bold text-slate-300">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPriceMov)}
                </p>
              </div>
            </div>
          </label>
        )}
      </div>

      {/* Tổng & Nút mua */}
      <div className="border-t border-slate-800 pt-5 mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Giá sản phẩm</span>
          <span className="text-lg font-bold text-cyan-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleBuyNow}
          className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01]"
        >
          Mua ngay
        </button>
        
        <button
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl border transition-all ${
            added 
              ? 'bg-green-500/10 border-green-500/50 text-green-400' 
              : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {added ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Đã thêm vào giỏ
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Thêm vào giỏ hàng
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-slate-500 text-center mt-4 italic">
        * Cấp quyền Google Drive tự động ngay sau khi thanh toán.
      </p>
    </div>
  );
}
