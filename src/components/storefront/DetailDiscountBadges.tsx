'use client';

import { useFlashSale } from '@/hooks/useFlashSale';

interface DetailDiscountBadgesProps {
  globalDiscountPct: number;
}

export default function DetailDiscountBadges({ globalDiscountPct }: DetailDiscountBadgesProps) {
  const { isFlashSaleActive, flashSalePercent } = useFlashSale();

  if (globalDiscountPct === 0 && (!isFlashSaleActive || flashSalePercent <= 0)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {globalDiscountPct > 0 && (
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black border border-red-500/50 shadow-lg shadow-red-500/20">
          -{globalDiscountPct}%
        </span>
      )}
      
      {isFlashSaleActive && flashSalePercent > 0 && (
        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-black border border-amber-400/50 shadow-lg shadow-amber-500/20 flex items-center gap-1 animate-pulse">
          <svg className="w-3 h-3 text-yellow-100" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          +{flashSalePercent}% Thành Viên Mới
        </span>
      )}
    </div>
  );
}
