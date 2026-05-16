"use client";

import { useState } from 'react';
import VideoCard from './VideoCard';
import { Product } from '@/types';

interface StorefrontGridProps {
  products: Product[];
  tags: string[];
}

export default function StorefrontGrid({ products, tags }: StorefrontGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Lọc sản phẩm
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? product.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <>
      {/* Hero Section */}
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            {searchQuery ? 'Kết quả tìm kiếm' : (selectedTag ? `Thể loại: ${selectedTag}` : 'Video Mới Nhất')}
          </h2>
          <div className="text-sm text-slate-400">Hiển thị {filteredProducts.length} kết quả</div>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <p className="text-xl">Không tìm thấy video nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <VideoCard key={product.sku} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
