import React, { useState, useMemo } from 'react';
import VideoCard from '@/components/storefront/VideoCard';
import { Product } from '@/types';

/**
 * TagFilter component – renders a dynamic tag selector and filtered product grid.
 * Props:
 *   products – array of all active products (already filtered by status).
 */
export default function TagFilter({ products }: { products: Product[] }) {
  // Extract unique tags from the product list
  const allTags = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      p.tags?.forEach(t => set.add(t.trim()));
    });
    return Array.from(set);
  }, [products]);

  const [selected, setSelected] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearAll = () => setSelected([]);

  const filtered = useMemo(() => {
    if (selected.length === 0) return products;
    return products.filter(p =>
      selected.every(tag => p.tags?.includes(tag))
    );
  }, [selected, products]);

  return (
    <>
      {/* Filter Buttons */}
      <section className="border-y border-slate-800/60 bg-slate-950/50 sticky top-20 z-40 backdrop-blur-md">
        <div className="container mx-auto px-6 flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
          <button
            className="px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium whitespace-nowrap border border-slate-700"
            onClick={clearAll}
          >
            Tất cả
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selected.includes(tag) ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Video Mới Nhất</h2>
          <div className="text-sm text-slate-400">Hiển thị {filtered.length} kết quả</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <p className="text-xl">Chưa có video nào được đăng bán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => (
              <VideoCard key={product.sku} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
