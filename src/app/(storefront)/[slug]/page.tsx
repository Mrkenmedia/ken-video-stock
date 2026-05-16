import { getProducts } from '@/lib/google';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import BuyPanel from '@/components/storefront/BuyPanel';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const products = await getProducts();
  const product = products.find(p => p.slug === params.slug && p.status === 'active');
  
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

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const products = await getProducts();
  const product = products.find(p => p.slug === params.slug && p.status === 'active');

  if (!product) {
    notFound();
  }

  // Thumbnail: ưu tiên cột Sheets, fallback về Drive thumbnail API
  const thumbnail = product.thumbnailUrl
    || (product.driveDemoId ? `https://drive.google.com/thumbnail?id=${product.driveDemoId}&sz=w800` : '');

  // Chuyển Google Drive ID thành link embed
  const videoDemoUrl = product.driveDemoId.includes('http') 
    ? product.driveDemoId 
    : `https://drive.google.com/file/d/${product.driveDemoId}/preview`;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Video Player Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-cyan-900/20 group">
            {/* Nếu có link mp4 trực tiếp thì dùng <video>, ngược lại dùng iframe của Drive */}
            {videoDemoUrl.includes('preview') ? (
              <iframe 
                src={videoDemoUrl} 
                className="w-full h-full border-0" 
                allow="autoplay; fullscreen"
                title={product.name}
              />
            ) : (
              <video 
                src={videoDemoUrl} 
                className="w-full h-full object-contain"
                controls
                controlsList="nodownload"
                autoPlay
                muted
                loop
                poster={thumbnail}
              />
            )}
            {/* Watermark Pattern Overlay (Optional CSS pattern) */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/watermark-pattern.png')] bg-repeat"></div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 rounded-full border border-slate-700">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">Thông tin file</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Mã sản phẩm (SKU)</span>
                  <span className="text-white font-mono">{product.sku}</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Bản quyền (License)</span>
                  <span className="text-white">{product.licenseType || 'Thương mại (Commercial)'}</span>
                </li>
                <li className="flex justify-between pt-1">
                  <span>Khung hình / Định dạng</span>
                  <span className="text-white">4K / 60fps / MP4 & MOV</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sticky Checkout Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <BuyPanel sku={product.sku} priceMp4={product.priceMp4} priceMov={product.priceMov} />
          </div>
        </div>
      </div>
    </div>
  );
}
