"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoCard from './VideoCard';
import { Product, Banner } from '@/types';
import { generateIdFromSku } from '@/lib/utils';

interface StorefrontGridProps {
  products: Product[];
  tags: string[];
  banners?: Banner[];
}

export default function StorefrontGrid({ products, tags, banners = [] }: StorefrontGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('stt');
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-slide effect for banner carousel
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % banners.length);
    }, 6000); // 6 seconds auto-slide
    return () => clearInterval(interval);
  }, [banners]);

  const getMediaSrc = (url: string, type: 'image' | 'video') => {
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
      return type === 'video' ? `/api/drive-proxy?id=${driveId}` : `/api/thumbnail-proxy?id=${driveId}`;
    }
    return url;
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchLower) || 
                          generateIdFromSku(product.sku).toLowerCase().includes(searchLower) ||
                          product.tags.some(t => t.toLowerCase().includes(searchLower));
    const matchesTag = selectedTag ? product.tags.includes(selectedTag) : true;
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
        <section className="relative w-full h-[500px] md:h-[600px] bg-slate-950 overflow-hidden pt-20">
          {/* Banner slides */}
          <div className="absolute inset-0 w-full h-full">
            {banners.map((banner, index) => {
              const isActive = index === activeSlide;
              const mediaSrc = getMediaSrc(banner.mediaUrl, banner.mediaType as 'image' | 'video');
              
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Clickable background overlay link if linkUrl exists (separating Link from the interactive Search Bar) */}
                    {banner.linkUrl && (
                      <Link href={banner.linkUrl} className="absolute inset-0 z-10 cursor-pointer">
                        <span className="sr-only">Xem chi tiết {banner.title}</span>
                      </Link>
                    )}

                    {/* Media background */}
                    <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none">
                      {banner.mediaType === 'video' ? (
                        <video
                          src={mediaSrc}
                          className="w-full h-full object-cover opacity-35"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaSrc}
                          alt={banner.title || ''}
                          className="w-full h-full object-cover opacity-35"
                        />
                      )}
                      {/* Shadow overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
                    </div>
                    
                    {/* Text contents - pointer-events-none allows clicks to pass through to the background Link */}
                    <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center max-w-4xl animate-in fade-in duration-700 pointer-events-none">
                      {banner.title && (
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                          {banner.title}
                        </h1>
                      )}
                      {banner.subtitle && (
                        <p className="text-base md:text-lg text-slate-300 mb-8 max-w-2xl">
                          {banner.subtitle}
                        </p>
                      )}
                      
                      {/* Search bar inside all slides - pointer-events-auto restores clickability specifically for search input */}
                      <div className="w-full max-w-2xl relative group mt-2 pointer-events-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center bg-slate-900/90 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                          <div className="pl-6 text-slate-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Tìm kiếm video, thể loại, từ khóa..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-white px-4 py-4 md:py-5 focus:outline-none focus:ring-0 placeholder-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlide(prev => (prev - 1 + banners.length) % banners.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/50 backdrop-blur hover:bg-cyan-500/85 hover:text-white text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-lg"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlide(prev => (prev + 1) % banners.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/50 backdrop-blur hover:bg-cyan-500/85 hover:text-white text-slate-300 border border-slate-700 flex items-center justify-center transition-all shadow-lg"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
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
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                <div className="pl-6 text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm video, thể loại, từ khóa..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-white px-4 py-5 focus:outline-none focus:ring-0 placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter / Tabs */}
      <section className="border-y border-slate-800/60 bg-slate-950/50 sticky top-20 z-40 backdrop-blur-md">
        <div className="container mx-auto px-6 flex items-center gap-6 overflow-x-auto py-4 scrollbar-hide">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${!selectedTag ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}
          >
            Tất cả
          </button>
          {tags.map((tag) => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${selectedTag === tag ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-6 py-12 min-h-[500px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-white">
            {searchQuery ? 'Kết quả tìm kiếm' : (selectedTag ? `Thể loại: ${selectedTag}` : 'Video Mới Nhất')}
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
