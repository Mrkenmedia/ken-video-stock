'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BuyPanelProps {
  sku: string;
  priceMp4: number;
  priceMov: number;
}

export default function BuyPanel({ sku, priceMp4, priceMov }: BuyPanelProps) {
  const [format, setFormat] = useState<'MP4' | 'MOV'>('MP4');
  const router = useRouter();

  const currentPrice = format === 'MOV' ? priceMov : priceMp4;

  const handleBuy = () => {
    router.push(`/checkout?sku=${encodeURIComponent(sku)}&format=${format}`);
  };

  return (
    <div className="sticky top-28 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Chọn định dạng mua</h2>

      <div className="space-y-4 mb-8">
        {/* MP4 Option */}
        {priceMp4 > 0 && (
          <label
            className={`relative flex cursor-pointer rounded-2xl border-2 p-4 shadow-sm transition-all ${
              format === 'MP4'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
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
                <p className="font-semibold text-white">Định dạng MP4</p>
                <p className="text-sm text-slate-400">Tối ưu cho Web &amp; MXH</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-cyan-400 text-lg">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceMp4)}
                </p>
              </div>
            </div>
            {format === 'MP4' && (
              <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            )}
          </label>
        )}

        {/* MOV Option */}
        {priceMov > 0 && (
          <label
            className={`relative flex cursor-pointer rounded-2xl border-2 p-4 shadow-sm transition-all ${
              format === 'MOV'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
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
                <p className="font-semibold text-white">Định dạng MOV</p>
                <p className="text-sm text-slate-400">File gốc Alpha/ProRes</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-300 text-lg">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceMov)}
                </p>
              </div>
            </div>
            {format === 'MOV' && (
              <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            )}
          </label>
        )}
      </div>

      {/* Tổng & Nút mua */}
      <div className="border-t border-slate-800 pt-5 mb-5">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
          <span>Định dạng đã chọn</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{format}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Tổng thanh toán</span>
          <span className="text-xl font-bold text-cyan-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
          </span>
        </div>
      </div>

      <button
        onClick={handleBuy}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Mua Ngay
      </button>

      <p className="text-xs text-slate-500 text-center mt-4">
        File được cấp quyền tự động qua Google Drive trong 3–5 giây sau khi thanh toán VietQR.
      </p>
    </div>
  );
}
