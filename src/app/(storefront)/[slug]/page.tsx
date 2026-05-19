import { getProducts } from '@/lib/google';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { cache } from 'react';
import BuyPanel from '@/components/storefront/BuyPanel';
import VideoCard from '@/components/storefront/VideoCard';
import { generateIdFromSku } from '@/lib/utils';

/** Trích xuất Drive file ID từ full URL hoặc trả về nguyên bản */
function extractDriveId(value: string): string {
  if (!value) return '';
  const m = value.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})|[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1] || m[2];
  if (!value.includes('/') && !value.includes('?')) return value;
  return value;
}

/** Trích xuất YouTube Video ID từ mọi dạng URL YouTube */
function extractYouTubeId(value: string): string {
  if (!value) return '';
  const short = value.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = value.match(/(?:v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return '';
}

// cache() deduplicates calls within the same request:
// generateMetadata() and the page component both call this,
// but only ONE real Sheets API call fires per page render.
const getCachedProducts = cache(getProducts);

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const products = await getCachedProducts();
  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
  
  const target = slugify(decodeURIComponent(resolvedParams.slug));
  const product = products.find(p => {
    if (p.status !== 'active') return false;
    const generatedId = slugify(generateIdFromSku(p.sku));
    return slugify(p.sku || '') === target || slugify(p.slug || '') === target || slugify(p.name || '') === target || generatedId === target;
  });
  
  if (!product) return { title: 'Không tìm thấy' };

  return {
    title: product.name,
    description: `Mua video ${product.name} bản quyền chất lượng 4K/60fps. Tải ngay qua Google Drive.`,
    keywords: product.tags,
    openGraph: {
      title: product.name,
      description: `Mua video ${product.name} bản quyền chất lượng 4K/60fps.`,
      images: product.thumbnailUrl 
        ? [product.thumbnailUrl] 
        : product.driveDemoId 
          ? [`https://drive.google.com/thumbnail?id=${product.driveDemoId}&sz=w800`] 
          : [],
    }
  };
}


export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const products = await getCachedProducts();
  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
  
  const target = slugify(decodeURIComponent(resolvedParams.slug));
  const product = products.find(p => {
    if (p.status !== 'active') return false;
    const generatedId = slugify(generateIdFromSku(p.sku));
    // So khớp theo SKU hoặc Slug hoặc Name hoặc ID tự sinh
    return slugify(p.sku || '') === target || slugify(p.slug || '') === target || slugify(p.name || '') === target || generatedId === target;
  });


  if (!product) {
    notFound();
  }

  // Trích xuất Drive ID thuần (xử lý cả trường hợp full URL)
  const demoId = extractDriveId(product.driveDemoId);
  const youtubeId = extractYouTubeId(product.driveDemoId);
  const driveThumbId = demoId || extractDriveId(product.driveGocMp4Id) || extractDriveId(product.driveGocMovId);
  const isGoogleThumb = product.thumbnailUrl && (
    product.thumbnailUrl.includes('googleusercontent.com') || 
    product.thumbnailUrl.includes('drive.google.com') || 
    product.thumbnailUrl.includes('google.com')
  );
  const thumbnail = (product.thumbnailUrl && !isGoogleThumb)
    ? product.thumbnailUrl
    : (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '')
    || (driveThumbId ? `/api/thumbnail-proxy?id=${driveThumbId}` : '');

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Video Player Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl shadow-cyan-900/20 group">
          {/* Video Player — YouTube iframe OR Google Drive via proxy (no public share needed) */}
            {youtubeId ? (
              <iframe 
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
                className="w-full h-full border-0" 
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={product.name}
              />
            ) : demoId ? (
              <video
                src={`/api/drive-proxy?id=${demoId}`}
                className="w-full h-full object-contain"
                controls
                controlsList="nodownload"
                poster={thumbnail}
                preload="metadata"
                playsInline
              >
                Trình duyệt của bạn không hỗ trợ thẻ video.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <p>Video demo chưa có sẵn</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{product.name}</h1>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-mono border border-slate-700 font-bold">ID: {generateIdFromSku(product.sku)}</span>
                  <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30">Bản Demo</span>
                  {/* Discount badge — tính từ giá gốc Sheets (server-side) */}
                  {(() => {
                    const base = product.priceMp4 > 0 ? product.priceMp4 : product.priceMov;
                    const orig = product.priceMp4 > 0
                      ? (product.originalPriceMp4 ?? 0)
                      : (product.originalPriceMov ?? 0);
                    if (orig > base && base > 0) {
                      const pct = Math.round((1 - base / orig) * 100);
                      return (
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-black border border-orange-400/30 shadow-lg shadow-orange-500/20">
                          -{pct}% GIẢM
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium text-slate-400 bg-slate-800/50 rounded-lg border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-slate-400 leading-relaxed max-w-2xl">
                  {product.description || `Sở hữu ngay video "${product.name}" chất lượng cao. Video được quay với độ phân giải 4K, tốc độ khung hình 60fps cực kỳ mượt mà, phù hợp cho mọi nhu cầu dựng phim chuyên nghiệp.`}
                </p>
              </div>
              
              <div className="shrink-0 w-full md:w-auto">
                {demoId && (
                <a 
                  href={`https://drive.google.com/uc?export=download&id=${demoId}`}
                  target="_blank"
                  className="flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95 w-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Tải bản Demo miễn phí
                </a>
                )}
                <p className="text-[10px] text-slate-500 text-center mt-3 uppercase tracking-widest font-bold">
                  Dung lượng: {product.size || '~50MB'} • {product.driveGocMp4Id && product.driveGocMovId ? 'MP4 & MOV' : (product.driveGocMovId ? 'MOV' : 'MP4')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Thông số kỹ thuật</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Độ phân giải</span><span className="text-white font-bold">{product.resolution || '4K Ultra HD'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Tỷ lệ khung hình</span><span className="text-white font-bold">{product.fps || '60 FPS'}</span></div>
                  {product.duration && (
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Thời lượng</span><span className="text-white font-bold">{product.duration}</span></div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Định dạng</span>
                    <span className="text-white font-bold">
                      {(() => {
                        const formats = [];
                        if (product.driveGocMp4Id) formats.push("MP4");
                        if (product.driveGocMovId) formats.push("MOV");
                        return formats.length > 0 ? formats.join(" & ") : "MP4";
                      })()}
                    </span>
                  </div>
                </div>
             </div>
             <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Bản quyền & Sử dụng</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Giấy phép</span><span className="text-white font-bold">{product.licenseType || 'Standard'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Sử dụng</span><span className="text-white font-bold">Không giới hạn</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Cấp quyền</span><span className="text-white font-bold">Tự động 24/7</span></div>
                </div>
             </div>
          </div>
        </div>

        {/* Sticky Checkout Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-cyan-900/10">
            <BuyPanel 
              sku={product.sku} 
              name={product.name}
              thumbnailUrl={product.thumbnailUrl}
              priceMp4={product.priceMp4} 
              priceMov={product.priceMov} 
              hasMp4={!!product.driveGocMp4Id}
              hasMov={!!product.driveGocMovId}
              originalPriceMp4={product.originalPriceMp4}
              originalPriceMov={product.originalPriceMov}
            />
          </div>
        </div>
      </div>

      {/* Similar Videos Section */}
      {(() => {
        const similarProducts = products
          .filter(p => p.sku !== product.sku && p.status === 'active' && p.tags.some(t => product.tags.includes(t)))
          .slice(0, 4);

        if (similarProducts.length === 0) return null;

        return (
          <div className="mt-20 pt-12 border-t border-slate-800/60">
            <h2 className="text-2xl font-bold text-white mb-8">Video tương tự bạn có thể thích</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <VideoCard key={p.sku} product={p} />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
