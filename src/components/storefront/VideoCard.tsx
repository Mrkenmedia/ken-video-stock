'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useFlashSale } from '@/hooks/useFlashSale';
import { Product } from '@/types';
import { generateIdFromSku } from '@/lib/utils';

/** Trích xuất Drive file ID từ full URL hoặc trả về nguyên bản nếu đã là ID */
function extractDriveId(value: string): string {
  if (!value) return '';
  // Match: /file/d/<ID>/ or /open?id=<ID> or id=<ID>
  const m = value.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})|[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1] || m[2];
  // If it looks like a plain ID (no slashes), return as-is
  if (!value.includes('/') && !value.includes('?')) return value;
  return value;
}

/** Trích xuất YouTube Video ID từ mọi dạng URL YouTube */
function extractYouTubeId(value: string): string {
  if (!value) return '';
  // youtu.be/ID
  const short = value.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  // youtube.com/watch?v=ID  |  /embed/ID  |  /shorts/ID
  const long = value.match(/(?:v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return '';
}

interface VideoCardProps {
  product: Product;
}

export default function VideoCard({ product }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isFlashSaleActive, flashSalePercent } = useFlashSale();

  const isSaved = isInWishlist(product.sku);

  const getPrice = (basePrice: number) => {
    if (isFlashSaleActive && flashSalePercent > 0) {
      return Math.round((basePrice * (1 - flashSalePercent / 100)) / 1000) * 1000;
    }
    return basePrice;
  };

  // Tính % giảm giá để hiển thị badge: ưu tiên Flash Sale, sau đó lấy từ giá gốc Sheets
  const hasMp4 = product.priceMp4 > 0;
  const basePrice = hasMp4 ? product.priceMp4 : product.priceMov;
  const origPrice = hasMp4
    ? (product.originalPriceMp4 ?? product.priceMp4)
    : (product.originalPriceMov ?? product.priceMov);

  let discountBadgePct = 0;
  if (isFlashSaleActive && flashSalePercent > 0) {
    discountBadgePct = flashSalePercent;
  } else if (origPrice > basePrice && basePrice > 0) {
    discountBadgePct = Math.round((1 - basePrice / origPrice) * 100);
  }

  // Trích xuất Drive ID thực sự (có thể là full URL trong Sheets)
  const demoId = extractDriveId(product.driveDemoId);
  const youtubeId = extractYouTubeId(product.driveDemoId); // YouTube link support
  const mp4Id  = extractDriveId(product.driveGocMp4Id);
  const movId  = extractDriveId(product.driveGocMovId);

  // Ưu tiên thumbnailUrl từ Sheets, fallback về Drive Demo, sau đó về File Gốc MP4/MOV
  const driveThumbId = (!youtubeId && demoId) ? demoId : (mp4Id || movId);
  // YouTube thumbnail: dùng hq720 thumbnail thay vì Drive proxy
  const bgImage = product.thumbnailUrl
    || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '')
    || (driveThumbId ? `/api/thumbnail-proxy?id=${driveThumbId}` : '/placeholder-video.jpg');

  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
  const safeSlug = slugify(product.slug || product.sku);

  // Play video on hover (only for Google Drive videos, not YouTube)
  useEffect(() => {
    if (youtubeId) return; // YouTube videos can't be auto-played via <video> tag
    if (!videoRef.current) return;
    if (isHovered && demoId) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore play interruption errors
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [isHovered, demoId, youtubeId]);



  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setProgress(0);
    setIsScrubbing(false);
    if (scrubTimeoutRef.current) clearTimeout(scrubTimeoutRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoRef.current.duration || !isHovered) return;
    
    // Tạm dừng video để tua nhanh theo chuột (Scrubbing)
    if (!isScrubbing) {
      setIsScrubbing(true);
      videoRef.current.pause();
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    // Giới hạn tua để tránh spam Google Drive (chỉ tua nếu lệch > 2%)
    if (Math.abs(progress - percentage * 100) > 2) {
      videoRef.current.currentTime = percentage * videoRef.current.duration;
      setProgress(percentage * 100);
    }

    if (scrubTimeoutRef.current) clearTimeout(scrubTimeoutRef.current);
    
    // Tiếp tục phát lại sau khi ngừng di chuột 200ms
    scrubTimeoutRef.current = setTimeout(() => {
      setIsScrubbing(false);
      videoRef.current?.play().catch(() => {});
    }, 200);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const format = product.priceMp4 > 0 ? 'MP4' : 'MOV';
    // Lưu GIÁ GỐC — CartContext sẽ áp Flash Sale động
    const basePriceToStore = product.priceMp4 > 0 ? product.priceMp4 : product.priceMov;

    addToCart({
      sku: product.sku,
      name: product.name,
      format,
      price: basePriceToStore,
      thumbnailUrl: bgImage
    });
    setIsCartOpen(true);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    toggleWishlist(product.sku);
  };

  const handleSimilar = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    // Just mock functionality for now, redirect to search or something later
    if (product.tags.length > 0) {
      window.location.href = `/?search=${encodeURIComponent(product.tags[0])}`;
    }
  };

  return (
    <div 
      className="group relative rounded-lg overflow-hidden bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 block aspect-video"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Clickable Card Background Link */}
      <Link href={`/${safeSlug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Xem chi tiết {product.name}</span>
      </Link>

      {/* Static Thumbnail with Lazy Loading */}
      <img 
        src={bgImage} 
        alt={product.name}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video Preview — only for Google Drive (YouTube can't auto-play via <video>) */}
      {demoId && !youtubeId && (
        <video
          ref={videoRef}
          src={`/api/drive-proxy?id=${demoId}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      {/* YouTube hover overlay - show play icon when YouTube video */}
      {youtubeId && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-2xl">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}
      
      {/* Dark gradient overlays for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 opacity-80 pointer-events-none z-10"></div>
      
      {/* Hover gradient for Title */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 z-10 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* --- CORNER OVERLAYS (SHUTTERSTOCK STYLE) --- */}
      
      {/* Top Left: Format & Resolution */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 text-white pointer-events-none">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <span className="text-xs font-bold tracking-wide drop-shadow-md">
          {product.resolution || '4K'} {product.duration ? `• ${product.duration}` : ''}
        </span>
        {product.priceMp4 > 0 && <span className="ml-1 text-[10px] font-mono bg-white/20 px-1 rounded">MP4</span>}
        {discountBadgePct > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black uppercase text-white bg-red-500 rounded animate-pulse">
            -{discountBadgePct}%
          </span>
        )}
      </div>

      {/* Top Right: Save (Heart) */}
      <button 
        onClick={handleToggleWishlist}
        className="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white transition-all pointer-events-auto"
      >
        <svg className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        <span className="text-xs font-medium hidden sm:inline-block">Lưu</span>
      </button>

      {/* Center: Title (Visible on Hover) */}
      <div className={`absolute bottom-12 left-3 right-3 z-20 pointer-events-none transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
        <h3 className="text-white text-sm font-semibold line-clamp-2 drop-shadow-lg leading-tight">
          {product.name}
        </h3>
      </div>

      {/* Bottom Left: Preview / Similar */}
      <div className="absolute bottom-2 left-2 z-30 pointer-events-auto">
        <button 
          onClick={(e) => { e.preventDefault(); setShowPreviewModal(true); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <span className="text-xs font-medium">Xem trước</span>
        </button>
      </div>

      {/* Bottom Right: Price & Cart */}
      <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Price Box */}
        <div className="flex flex-col items-end mr-1 pointer-events-none">
          {(() => {
            const hasMp4 = product.priceMp4 > 0;
            const basePrice = hasMp4 ? product.priceMp4 : product.priceMov;
            const flashPrice = getPrice(basePrice);
            let origPrice = hasMp4 ? (product.originalPriceMp4 ?? product.priceMp4) : (product.originalPriceMov ?? product.priceMov);
            if (isFlashSaleActive) origPrice = basePrice;
            const isDiscounted = isFlashSaleActive || (hasMp4 ? !!product.originalPriceMp4 : !!product.originalPriceMov);
            
            return (
              <>
                {isDiscounted && origPrice > flashPrice && (
                  <span className="text-[10px] text-slate-400 line-through leading-none drop-shadow">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(origPrice)}
                  </span>
                )}
                <span className="text-cyan-400 font-bold text-sm leading-none drop-shadow-md">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(flashPrice)}
                </span>
              </>
            );
          })()}
        </div>

        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 backdrop-blur-sm text-white transition-all shadow-lg"
          title="Thêm vào giỏ hàng"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </button>
      </div>

      {/* Progress Bar (Visible when playing/scrubbing) */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80 z-20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="h-full bg-cyan-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Preview Modal */}
      {showPreviewModal && demoId && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[95vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm shrink-0">
               <div>
                 <h3 className="text-xl font-bold text-white line-clamp-1">{product.name}</h3>
                 <p className="text-xs text-slate-500 font-mono mt-1">Mã số: {generateIdFromSku(product.sku)}</p>
               </div>
               <button 
                 onClick={() => setShowPreviewModal(false)} 
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0 ml-4"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>
            
            {/* Video Player */}
            <div className="relative aspect-video bg-black shrink-0 min-h-0">
               {youtubeId ? (
                 <iframe
                   src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                   className="w-full h-full border-0"
                   allow="autoplay; encrypted-media"
                   allowFullScreen
                   title={product.name}
                 />
               ) : (
                 <video
                   src={`/api/drive-proxy?id=${demoId}`}
                   controls
                   autoPlay
                   className="w-full h-full object-contain"
                   controlsList="nodownload"
                 />
               )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 flex flex-col sm:flex-row justify-between items-center bg-slate-900 gap-4 shrink-0 overflow-y-auto">
               <div>
                 {(() => {
                   const hasMp4 = product.priceMp4 > 0;
                   const basePrice = hasMp4 ? product.priceMp4 : product.priceMov;
                   const flashPrice = getPrice(basePrice);
                   
                   let origPrice = hasMp4 ? (product.originalPriceMp4 ?? product.priceMp4) : (product.originalPriceMov ?? product.priceMov);
                   if (isFlashSaleActive) origPrice = basePrice;
                   
                   const isDiscounted = isFlashSaleActive || (hasMp4 ? !!product.originalPriceMp4 : !!product.originalPriceMov);
                   
                   return (
                     <div className="flex items-center gap-3">
                       <span className="text-cyan-400 font-bold text-2xl">
                         {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(flashPrice)}
                       </span>
                       {isDiscounted && origPrice > flashPrice && (
                         <span className="text-sm text-slate-500 line-through">
                           {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(origPrice)}
                         </span>
                       )}
                     </div>
                   );
                 })()}
                 <div className="flex gap-2 mt-1.5">
                   {product.priceMp4 > 0 && <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-mono">MP4</span>}
                   {product.priceMov > 0 && <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-mono">MOV</span>}
                   <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{product.resolution || '4K'}</span>
                 </div>
               </div>
               
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link 
                    href={`/${safeSlug}`} 
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors text-center"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    Xem chi tiết
                  </Link>
                  <button 
                    onClick={(e) => { handleAddToCart(e); setShowPreviewModal(false); }} 
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Mua ngay
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
