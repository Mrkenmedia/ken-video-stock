import Link from 'next/link';
import { Product } from '@/types';

interface VideoCardProps {
  product: Product;
}

export default function VideoCard({ product }: VideoCardProps) {
  // Ưu tiên thumbnailUrl từ Sheets, fallback về Drive thumbnail API của file Demo
  const bgImage = product.thumbnailUrl
    || (product.driveDemoId ? `https://drive.google.com/thumbnail?id=${product.driveDemoId}&sz=w800` : '/placeholder-video.jpg');

  const safeSlug = (product.slug || product.sku).toLowerCase().replace(/\./g, '-');

  return (
    <Link href={`/${safeSlug}`} className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 block">
      {/* Thumbnail / Video Preview Area */}
      <div className="relative aspect-video overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-cyan-500/90 backdrop-blur flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        
        {/* Format Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.priceMp4 > 0 && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-slate-900/80 backdrop-blur rounded shadow">MP4</span>
          )}
          {product.priceMov > 0 && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-50 bg-cyan-600/80 backdrop-blur rounded shadow">MOV</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-lg text-slate-100 line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-cyan-400 font-bold whitespace-nowrap">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMp4 > 0 ? product.priceMp4 : product.priceMov)}
          </p>
        </div>
        
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          {product.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-800/50 rounded-md whitespace-nowrap">
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && (
            <span className="text-xs text-slate-500">+{product.tags.length - 3}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
