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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const srcLoadedRef = useRef(false); // Track if src has been set (lazy load)
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lắng nghe sự kiện để dừng video này nếu một video khác bắt đầu phát
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== product.sku) {
        setIsPreviewPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    };
    window.addEventListener('storefront_play_preview', handleGlobalPlay);
    return () => {
      window.removeEventListener('storefront_play_preview', handleGlobalPlay);
    };
  }, [product.sku]);
  
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

  // Ưu tiên thumbnailUrl từ Sheets (nếu là link ngoài công khai), fallback về Drive Demo proxy, sau đó về File Gốc MP4/MOV proxy
  const driveThumbId = (!youtubeId && demoId) ? demoId : (mp4Id || movId);
  
  // Phát hiện xem thumbnail từ Sheets có phải là link Google Drive/Usercontent riêng tư hay không
  const isGoogleThumb = product.thumbnailUrl && (
    product.thumbnailUrl.includes('googleusercontent.com') || 
    product.thumbnailUrl.includes('drive.google.com') || 
    product.thumbnailUrl.includes('google.com')
  );

  // YouTube thumbnail: dùng maxresdefault để có chất lượng cao nhất, Google Drive dùng proxy với size lớn, link ngoài dùng trực tiếp
  const bgImage = (product.thumbnailUrl && !isGoogleThumb)
    ? product.thumbnailUrl
    : (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : '')
    || (driveThumbId ? `/api/thumbnail-proxy?id=${driveThumbId}&size=1920` : '/placeholder-video.jpg');

  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
  const safeSlug = slugify(product.slug || product.sku);

  // ── Shutterstock-style lazy src swap ──────────────────────────────────────
  // Video element has NO src initially (preload="none").
  // On mouseenter: set src once → play() (browser auto-loads). Zero bandwidth until hover.
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Không tắt video khi hover ra ngoài, vẫn tiếp tục phát
  };

  const togglePlayPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPreviewPlaying) {
      setIsPreviewPlaying(false);
      videoRef.current?.pause();
      return;
    }
    
    // Phát event để tắt các video đang chạy khác
    window.dispatchEvent(new CustomEvent('storefront_play_preview', { detail: product.sku }));
    
    setIsPreviewPlaying(true);
    
    if (youtubeId) {
       setIsBuffering(true);
       setTimeout(() => setIsBuffering(false), 1000); // Tạm ẩn buffering sau 1s cho iframe
       return;
    }

    if (!demoId || !videoRef.current) return;

    const video = videoRef.current;
    if (!srcLoadedRef.current) {
      video.src = `/api/drive-proxy?id=${demoId}`;
      video.load();
      srcLoadedRef.current = true;
      setIsBuffering(true);
    }

    video.play().catch(err => {
      console.warn("Video play failed:", err);
    });
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleVideoPlaying = () => {
    setIsBuffering(false);
  };

  const handleVideoWaiting = () => {
    setIsBuffering(true);
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
      ref={containerRef}
      className="group relative rounded-lg overflow-hidden bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 block aspect-video"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clickable Card Background to trigger Preview Play */}
      <button 
        onClick={togglePlayPreview}
        className="absolute inset-0 z-10 w-full h-full text-left cursor-pointer focus:outline-none"
      >
        <span className="sr-only">Phát video {product.name}</span>
      </button>

      {/* Static Thumbnail with Lazy Loading */}
      <img 
        src={bgImage} 
        alt={product.name}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video Preview (Google Drive) */}
      {demoId && !youtubeId && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-500 ${isPreviewPlaying ? 'opacity-100' : 'opacity-0'}`}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={handleVideoPlaying}
          onWaiting={handleVideoWaiting}
        />
      )}

      {/* YouTube Preview */}
      {youtubeId && isPreviewPlaying && (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-black flex items-center justify-center">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${youtubeId}&vq=hd1080`}
            className="w-full h-full object-contain"
            style={{ border: 0 }}
            allow="autoplay; encrypted-media"
            title={product.name}
          />
        </div>
      )}

      {/* Buffering spinner */}
      {isPreviewPlaying && isBuffering && demoId && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* Play Icon when not playing */}
      {!isPreviewPlaying && (
        <div className={`absolute inset-0 flex items-center justify-center z-15 pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
           <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
           </div>
        </div>
      )}
      
      {/* Dark gradient overlays for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 opacity-80 pointer-events-none z-10"></div>
      
      {/* Hover gradient for Title */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 z-10 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* --- CORNER OVERLAYS (SHUTTERSTOCK STYLE) --- */}
      
      {/* Top Left: Title & Resolution */}
      <div className="absolute top-2 left-2 right-12 z-20 flex flex-col items-start gap-1 text-white pointer-events-none">
        {/* Title (Always visible or prominent) */}
        <h3 className="text-sm font-bold tracking-wide drop-shadow-md line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        {/* ID & Format (Visible on Hover) */}
        <div className={`flex items-center gap-1.5 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
          <span className="text-[10px] font-bold tracking-wide bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded drop-shadow-md border border-white/10">
            ID: {generateIdFromSku(product.sku)}
          </span>
          {product.priceMp4 > 0 && <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded shadow-sm">MP4</span>}
          {discountBadgePct > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase text-white bg-red-500 rounded animate-pulse shadow-sm">
              -{discountBadgePct}%
            </span>
          )}
        </div>
      </div>

      {/* Top Right: Actions (Fullscreen, Download, Save) */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 pointer-events-auto">
        {/* Nút Toàn màn hình */}
        <button 
          onClick={toggleFullscreen}
          className="flex items-center justify-center p-1.5 rounded bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white transition-all"
          title="Toàn màn hình"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>

        {/* Nút Tải Demo (Chỉ áp dụng cho Drive) */}
        {demoId && !youtubeId && (
          <a 
            href={`/api/drive-proxy?id=${demoId}`}
            download={`${safeSlug}-demo.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center p-1.5 rounded bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white transition-all hover:text-cyan-400"
            title="Tải video Demo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        )}

        {/* Nút Yêu thích */}
        <button 
          onClick={handleToggleWishlist}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white transition-all"
          title="Lưu yêu thích"
        >
          <svg className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <span className="text-xs font-medium hidden sm:inline-block">Lưu</span>
        </button>
      </div>

      {/* Bottom Left: Xem Chi Tiết */}
      <div className="absolute bottom-2 left-2 z-30 pointer-events-auto">
        <Link 
          href={`/${safeSlug}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg text-white font-bold transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Chi tiết</span>
        </Link>
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
                  <span className="text-[10px] text-white line-through leading-none drop-shadow">
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

      {/* Note: Thẻ Progress Bar đã bị loại bỏ vì không còn sử dụng chức năng tua (scrubbing) */}

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
                   src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&loop=1&playlist=${youtubeId}`}
                   className="w-full h-full border-0"
                   allow="autoplay; encrypted-media"
                   allowFullScreen
                   title={product.name}
                 />
               ) : (
                 <video
                   src={`/api/drive-proxy?id=${demoId}`}
                   className="w-full h-full object-contain"
                   controls
                   autoPlay
                   controlsList="nodownload"
                   preload="metadata"
                   playsInline
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
                         <span className="text-sm text-white line-through">
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
