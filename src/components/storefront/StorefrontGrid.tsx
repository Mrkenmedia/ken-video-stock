"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import VideoCard from './VideoCard';
import { Product, Banner } from '@/types';
import { generateIdFromSku } from '@/lib/utils';

export interface Collection {
  id: string;
  title: string;
  skus: string;
}

interface StorefrontGridProps {
  products: Product[];
  tags: string[];
  banners?: Banner[];
  collections?: Collection[];
  settings?: any;
}

// Sub-component for a single collection row with scroll buttons
function CollectionCarousel({ collection, collectionProducts }: { collection: any, collectionProducts: Product[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth * 0.8; // scroll 80% of the container width
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 tracking-tight drop-shadow-sm">
          {collection.title}
        </h2>
        <div className="h-[2px] flex-grow ml-6 bg-gradient-to-r from-amber-500/20 to-transparent"></div>
        
        {/* Navigation Arrows for Desktop */}
        <div className="hidden md:flex items-center gap-2 ml-6">
          <button 
            onClick={() => scroll('left')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition shadow-lg backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition shadow-lg backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      
      {/* Floating side navigation buttons for when hovering over the row */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 -ml-4 z-10 opacity-0 group-hover:opacity-100 transition duration-300 hidden md:block">
        <button 
          onClick={() => scroll('left')}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-900/90 border border-slate-700 text-amber-400 hover:text-white hover:bg-amber-600 hover:border-amber-500 transition shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          <svg className="w-6 h-6 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-0 -mr-4 z-10 opacity-0 group-hover:opacity-100 transition duration-300 hidden md:block">
        <button 
          onClick={() => scroll('right')}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-900/90 border border-slate-700 text-amber-400 hover:text-white hover:bg-amber-600 hover:border-amber-500 transition shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          <svg className="w-6 h-6 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {collectionProducts.map((product) => (
          <div key={product.sku} className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 snap-start">
            <VideoCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StorefrontGrid({ products, tags, banners = [], collections = [], settings }: StorefrontGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('stt');
  const [activeSlide, setActiveSlide] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(80);

  // Swipe / Drag dùng useRef để tránh re-render
  const bannerRef = useRef<HTMLElement>(null);
  const dragState = useRef({ startX: 0, endX: 0, isDragging: false });
  const minSwipeDistance = 50;

  const handleSwipeEnd = useCallback(() => {
    const { startX, endX, isDragging } = dragState.current;
    if (!isDragging) return;
    dragState.current.isDragging = false;
    const distance = startX - endX;
    if (Math.abs(distance) < minSwipeDistance) return;
    if (distance > 0 && banners.length > 1) {
      // Vuốt trái → slide tiếp
      setActiveSlide(prev => (prev + 1) % banners.length);
    } else if (distance < 0 && banners.length > 1) {
      // Vuốt phải → slide trước
      setActiveSlide(prev => (prev - 1 + banners.length) % banners.length);
    }
  }, [banners.length]);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      dragState.current = { startX: e.touches[0].clientX, endX: e.touches[0].clientX, isDragging: true };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (dragState.current.isDragging) {
        dragState.current.endX = e.touches[0].clientX;
      }
    };
    const onTouchEnd = () => handleSwipeEnd();

    const onMouseDown = (e: MouseEvent) => {
      dragState.current = { startX: e.clientX, endX: e.clientX, isDragging: true };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (dragState.current.isDragging) {
        dragState.current.endX = e.clientX;
      }
    };
    const onMouseUp = () => handleSwipeEnd();
    const onMouseLeave = () => handleSwipeEnd();

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [handleSwipeEnd]);

  // Tính toán chiều cao thực tế của header để ghim (sticky) thanh filter
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('main-header-wrapper');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    const timeout = setTimeout(updateHeaderHeight, 500);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timeout);
    };
  }, []);

  // Auto-slide effect for banner carousel
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % banners.length);
    }, 6000); // 6 seconds auto-slide
    return () => clearInterval(interval);
  }, [banners]);

  const extractYouTubeId = (value: string): string => {
    if (!value) return '';
    const short = value.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (short) return short[1];
    const long = value.match(/(?:v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    if (long) return long[1];
    return '';
  };

  const getMediaSrc = (url: string, type: 'image' | 'video', size?: string) => {
    if (!url) return '';
    
    // Extract Drive ID from full URL or use raw ID
    let driveId = url;
    const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})|[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (m) {
      driveId = m[1] || m[2];
    }

    // Check if it's a valid Drive ID (no slashes/params)
    const isDriveId = /^[a-zA-Z0-9_-]{10,}$/.test(driveId) && !driveId.includes('/');
    
    if (isDriveId) {
      // Proxy videos qua drive-proxy, ảnh qua thumbnail-proxy (hoặc chung)
      return type === 'video' 
        ? `/api/drive-proxy?id=${driveId}` 
        : `/api/thumbnail-proxy?id=${driveId}${size ? `&size=${size}` : ''}`;
    }
    return url;
  };

  // Hàm loại bỏ dấu tiếng Việt để tìm kiếm chính xác
  const normalizeStr = (str: string) => {
    if (!str) return '';
    return str.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter(product => {
    const searchNorm = normalizeStr(searchQuery);
    
    const matchesTag = selectedTag ? product.tags.includes(selectedTag) : true;
    
    if (!searchNorm) return matchesTag;

    const nameNorm = normalizeStr(product.name);
    const skuNorm = normalizeStr(generateIdFromSku(product.sku));
    
    let matchesSearch = nameNorm.includes(searchNorm) || skuNorm.includes(searchNorm);
    
    if (!matchesSearch && product.tags) {
      matchesSearch = product.tags.some(t => normalizeStr(t).includes(searchNorm));
    }
    
    return matchesSearch && matchesTag;
  });

  // Sắp xếp sản phẩm (Ưu tiên theo số thứ tự STT, Tên Video, hoặc Giá)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'stt') {
      const sttA = a.stt ?? 999999;
      const sttB = b.stt ?? 999999;
      if (sttA !== sttB) {
        return sttA - sttB;
      }
      // Nếu STT bằng nhau hoặc trống, sắp xếp theo tên A-Z
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    }
    if (sortBy === 'nameAsc') {
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    }
    if (sortBy === 'nameDesc') {
      return b.name.localeCompare(a.name, 'vi', { sensitivity: 'base' });
    }
    if (sortBy === 'priceAsc') {
      const priceA = a.priceMp4 > 0 ? a.priceMp4 : a.priceMov;
      const priceB = b.priceMp4 > 0 ? b.priceMp4 : b.priceMov;
      return priceA - priceB;
    }
    if (sortBy === 'priceDesc') {
      const priceA = a.priceMp4 > 0 ? a.priceMp4 : a.priceMov;
      const priceB = b.priceMp4 > 0 ? b.priceMp4 : b.priceMov;
      return priceB - priceA;
    }
    return 0;
  });

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Reset khi bộ lọc hoặc kiểu sắp xếp thay đổi
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedTag, sortBy]);

  // Handle infinite scroll and back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }

      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, sortedProducts.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedProducts.length]);

  const displayedProducts = sortedProducts.slice(0, visibleCount);

  const goToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero / Banner Carousel Section */}
      {banners && banners.length > 0 ? (
        <section 
          ref={bannerRef}
          className="relative w-full aspect-video min-h-[300px] max-h-[800px] bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Banner slides */}
          <div className="absolute inset-0 w-full h-full">
            {banners.map((banner, index) => {
              const isActive = index === activeSlide;
              const mediaSrc = getMediaSrc(banner.mediaUrl, banner.mediaType as 'image' | 'video', '2048');
              const youtubeId = banner.mediaType === 'video' ? extractYouTubeId(banner.mediaUrl) : '';
              
              return (
                <div
                  key={`${banner.id}-${index}`}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Clickable background overlay link if linkUrl exists */}
                    {banner.linkUrl && (
                      <Link href={banner.linkUrl} className="absolute inset-0 z-10 cursor-pointer touch-none pointer-events-auto" draggable={false}>
                        <span className="sr-only">Xem chi tiết {banner.title}</span>
                      </Link>
                    )}

                    {/* Media background */}
                    <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none overflow-hidden">
                      {banner.mediaType === 'video' ? (
                        youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&modestbranding=1&vq=hd1080&iv_load_policy=3&disablekb=1&fs=0`}
                            className="absolute pointer-events-none"
                            style={{
                              top: '50%',
                              left: '50%',
                              width: '177.78vh',
                              minWidth: '100%',
                              height: '56.25vw',
                              minHeight: '100%',
                              transform: 'translate(-50%, -50%) scale(1.05)',
                              opacity: banner.opacity !== undefined ? banner.opacity / 100 : 0.6,
                            }}
                            allow="autoplay; encrypted-media"
                            title={banner.title || 'Banner'}
                          />
                        ) : (
                          <video
                            src={mediaSrc}
                            className="w-full h-full object-cover"
                            style={{ opacity: banner.opacity !== undefined ? banner.opacity / 100 : 0.6 }}
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        )
                      ) : (
                        <img
                          src={mediaSrc}
                          alt={banner.title || ''}
                          className="w-full h-full object-cover"
                          style={{ opacity: banner.opacity !== undefined ? banner.opacity / 100 : 0.6 }}
                        />
                      )}
                      {/* Shadow overlay gradient - lighter for better visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    </div>
                    
                    {/* Text contents - pointer-events-none allows clicks to pass through to the background Link */}
                    <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center max-w-4xl animate-in fade-in duration-700 pointer-events-none">
                      {banner.title && (
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight drop-shadow-lg">
                          {banner.title}
                        </h1>
                      )}
                      {banner.subtitle && (
                        <p className="text-base md:text-lg text-slate-200 mb-8 max-w-2xl drop-shadow">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                      
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === activeSlide ? 'bg-cyan-400 w-8' : 'bg-slate-600/80 hover:bg-slate-500'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Fallback Static Hero Section */
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 blur-[100px] rounded-full mix-blend-screen" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
              Nâng tầm dự án với <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                Video Cực Chất
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
              Hàng ngàn footage chất lượng 4K/60fps. Mua một lần, sử dụng vĩnh viễn. Giao file tự động qua Google Drive trong 5 giây.
            </p>
          </div>
        </section>
      )}

      {/* Filter / Tabs & Search Bar */}
      <section 
        className="border-y border-slate-800/60 bg-slate-950/95 sticky z-40 backdrop-blur-xl shadow-lg transition-all duration-300"
        style={{ top: `${headerHeight}px` }}
      >
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 py-3 md:py-4">
          
          {/* Mobile Category Menu (Dropdown) */}
          <div className="w-full md:hidden relative">
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="w-full appearance-none bg-slate-900/80 backdrop-blur border border-slate-700 text-white rounded-full px-5 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer font-medium"
              style={{ fontSize: settings?.tagFontSize || '14px' }}
            >
              <option value="">Tất cả danh mục</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-cyan-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Desktop Tags list */}
          <div className="hidden md:flex flex-wrap items-center gap-2.5 flex-1">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap border transition-all ${!selectedTag ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'}`}
              style={{ fontSize: settings?.tagFontSize || '14px' }}
            >
              Tất cả
            </button>
            {tags.map((tag) => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap border transition-all ${selectedTag === tag ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'}`}
                style={{ fontSize: settings?.tagFontSize || '14px' }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="w-full md:w-80 shrink-0 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full overflow-hidden focus-within:border-cyan-500 transition-colors">
              <div className="pl-4 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm video..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-0 placeholder-slate-500"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-6 py-12 min-h-[500px]">
        {/* Render Collections if no search/filter is active */}
        {!searchQuery && !selectedTag && collections && collections.length > 0 && (
          <div className="mb-16 space-y-12">
            {collections.map(collection => {
              const skuList = collection.skus.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
              // Lấy ra các sản phẩm thuộc collection này, xếp theo đúng thứ tự SKU nhập vào
              const collectionProducts = skuList.map(sku => products.find(p => p.sku.toLowerCase() === sku)).filter(Boolean) as Product[];
              
              if (collectionProducts.length === 0) return null;

              return (
                <CollectionCarousel 
                  key={collection.id} 
                  collection={collection} 
                  collectionProducts={collectionProducts} 
                />
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-white">
            {searchQuery ? 'Kết quả tìm kiếm' : (selectedTag ? `Thể loại: ${selectedTag}` : 'Tất cả Video (Mới Nhất)')}
          </h2>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <span className="text-sm text-slate-400 hidden md:inline">Hiển thị {filteredProducts.length} kết quả</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
            >
              <option value="stt">Mặc định (STT)</option>
              <option value="nameAsc">Tên Video (A → Z)</option>
              <option value="nameDesc">Tên Video (Z → A)</option>
              <option value="priceAsc">Giá bán (Thấp → Cao)</option>
              <option value="priceDesc">Giá bán (Cao → Thấp)</option>
            </select>
          </div>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <p className="text-xl">Không tìm thấy video nào phù hợp.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map((product, index) => (
                <VideoCard key={`${product.sku}-${index}`} product={product} />
              ))}
            </div>
            
            {visibleCount < filteredProducts.length && (
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 text-cyan-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Đang tải thêm...
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Back to top button */}
      <button 
        onClick={goToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 transition-all duration-300 hover:bg-cyan-500 hover:-translate-y-1 ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Lên đầu trang"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      </button>
    </>
  );
}
