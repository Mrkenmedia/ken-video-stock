import { getProducts } from '@/lib/google';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import BuyPanel from '@/components/storefront/BuyPanel';
import VideoCard from '@/components/storefront/VideoCard';
import { generateIdFromSku } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const products = await getProducts();
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
  const products = await getProducts();
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

  // Thumbnail: ưu tiên cột Sheets, fallback về Drive Demo, sau đó về File Gốc
  const driveThumbId = product.driveDemoId || product.driveGocMp4Id || product.driveGocMovId;
  const thumbnail = product.thumbnailUrl
    || (driveThumbId ? `https://drive.google.com/thumbnail?id=${driveThumbId}&sz=w800` : '');

  // Chuyển Google Drive ID thành link embed
  const videoDemoUrl = product.driveDemoId.includes('http') 
    ? product.driveDemoId 
    : `https://drive.google.com/file/d/${product.driveDemoId}/preview`;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Video Player Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl shadow-cyan-900/20 group">
            {/* Google Drive Preview Player */}
            <iframe 
              src={`https://drive.google.com/file/d/${product.driveDemoId}/preview`} 
              className="w-full h-full border-0" 
              allow="autoplay"
              title={product.name}
            />
          </div>

          <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{product.name}</h1>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-mono border border-slate-700 font-bold">ID: {generateIdFromSku(product.sku)}</span>
                  <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30">Bản Demo</span>
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
                <a 
                  href={`https://drive.google.com/uc?export=download&id=${product.driveDemoId}`}
                  target="_blank"
                  className="flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95 w-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Tải bản Demo miễn phí
                </a>
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
