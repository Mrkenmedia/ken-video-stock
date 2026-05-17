'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useFlashSale } from '@/hooks/useFlashSale';
import { Product } from '@/types';
import { generateIdFromSku } from '@/lib/utils';

interface VideoCardProps {
  product: Product;
}

export default function VideoCard({ product }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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

  // Ưu tiên thumbnailUrl từ Sheets, fallback về Drive Demo, sau đó về File Gốc MP4/MOV
  const driveThumbId = product.driveDemoId || product.driveGocMp4Id || product.driveGocMovId;
  const bgImage = product.thumbnailUrl
    || (driveThumbId ? `/api/drive-proxy?id=${driveThumbId}` : '/placeholder-video.jpg');

  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
  const safeSlug = slugify(product.slug || product.sku);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    const format = product.priceMp4 > 0 ? 'MP4' : 'MOV';
    const basePrice = product.priceMp4 > 0 ? product.priceMp4 : product.priceMov;
    const price = getPrice(basePrice);
    
    addToCart({
      sku: product.sku,
      name: product.name,
      format,
      price,
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
      className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clickable Card Background Link */}
      <Link href={`/${safeSlug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Xem chi tiết {product.name}</span>
      </Link>
      {/* Thumbnail / Video Preview Area */}
      <div className="relative aspect-video overflow-hidden bg-slate-950">
        {/* Static Thumbnail with Lazy Loading */}
        <img 
          src={bgImage} 
          alt={product.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered && product.driveDemoId ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Video Preview (Only loaded & played on hover) */}
        {product.driveDemoId && isHovered && (
          <video
            ref={videoRef}
            src={`/api/drive-proxy?id=${product.driveDemoId}`}
            className="absolute inset-0 w-full h-full object-cover opacity-100"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
          />
        )}
        
        {/* Play Icon Overlay (Only visible when not hovering or no video) */}
        <div className={`absolute inset-0 bg-slate-950/20 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300 border border-white/20">
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        
        {/* Format Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none">
          {product.priceMp4 > 0 && product.driveGocMp4Id && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-slate-900/80 backdrop-blur rounded shadow">MP4</span>
          )}
          {product.priceMov > 0 && product.driveGocMovId && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-50 bg-cyan-600/80 backdrop-blur rounded shadow">MOV</span>
          )}
        </div>

        {/* Action Buttons Overlay (Visible on Hover) */}
        <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 transition-opacity duration-300 z-20 ${isHovered ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />
        
        {/* Save Button (Top Right) */}
        <button 
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} ${isSaved ? 'bg-red-500 text-white border-red-500' : 'bg-slate-900/60 text-white border-slate-700/50 hover:bg-slate-800/80'}`}
        >
          <svg className={`w-4 h-4 ${isSaved ? 'fill-current' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <span className="text-xs font-semibold">Lưu</span>
        </button>

        {/* Bottom Actions */}
        <div className={`absolute bottom-3 left-3 right-3 flex justify-between items-center z-30 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} pointer-events-none`}>
          {/* Similar Button */}
          <button 
            onClick={handleSimilar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-white hover:bg-slate-800/80 transition-colors pointer-events-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span className="text-xs font-semibold">Tương tự</span>
          </button>
          
          {/* Right Action buttons group */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Download Demo Button */}
            {product.driveDemoId && (
              <a 
                href={`/api/drive-proxy?id=${product.driveDemoId}`}
                download={`${product.name}-demo.mp4`}
                onClick={(e) => e.stopPropagation()} // Prevent card navigation click
                className="h-10 px-3.5 flex items-center gap-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/60 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-lg"
                title="Tải Video Demo chất lượng thấp"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-xs font-bold whitespace-nowrap">Tải Demo</span>
              </a>
            )}

            {/* Add to Cart Button */}
            <button 
              onClick={handleAddToCart}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/60 text-white hover:bg-cyan-500 hover:border-cyan-500 transition-all shadow-lg"
              title="Thêm vào giỏ hàng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 relative z-20 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base text-slate-100 line-clamp-1 group-hover:text-cyan-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Mã số: {generateIdFromSku(product.sku)}</p>
          </div>
          <div className="text-right shrink-0">
            {(() => {
              const hasMp4 = product.priceMp4 > 0;
              const basePrice = hasMp4 ? product.priceMp4 : product.priceMov;
              const flashPrice = getPrice(basePrice);
              
              let origPrice = hasMp4 ? (product.originalPriceMp4 ?? product.priceMp4) : (product.originalPriceMov ?? product.priceMov);
              if (isFlashSaleActive) {
                origPrice = basePrice;
              }
              
              const isDiscounted = isFlashSaleActive || (hasMp4 ? !!product.originalPriceMp4 : !!product.originalPriceMov);
              
              return (
                <>
                  {isDiscounted && origPrice > flashPrice ? (
                    <span className="text-xs text-slate-500 line-through block leading-none mb-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(origPrice)}
                    </span>
                  ) : null}
                  <span className="text-cyan-400 font-bold text-sm block leading-none">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(flashPrice)}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          {product.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-800/50 rounded whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
