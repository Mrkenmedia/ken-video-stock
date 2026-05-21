'use client';

import { useFlashSale } from '@/hooks/useFlashSale';

export default function FlashSaleBanner({ settings }: { settings?: any }) {
  const { isFlashSaleActive, flashSalePercent, timeLeftMs } = useFlashSale(settings);

  if (!isFlashSaleActive || timeLeftMs <= 0) return null;

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);

  return (
    <div className="bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 text-white text-xs md:text-sm font-bold text-center py-2.5 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 relative z-50 shadow-md">
      <span className="inline-flex items-center gap-1.5 animate-pulse">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        🔥 ƯU ĐÃI THÀNH VIÊN MỚI: Giảm thêm {flashSalePercent}% toàn bộ kho Video!
      </span>
      <span className="bg-black/25 px-3 py-1 rounded-full font-mono font-black border border-white/20 tracking-wider flex items-center gap-1.5 shadow-inner">
        <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Kết thúc sau: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
