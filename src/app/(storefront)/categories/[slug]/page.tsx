import { getProducts } from '@/lib/google';
import VideoCard from '@/components/storefront/VideoCard';
import Link from 'next/link';

export const revalidate = 300;

// Helper để format slug thành tên hiển thị đẹp hơn
function formatCategoryName(slug: string) {
  // Thay thế dấu gạch ngang bằng dấu cách và viết hoa chữ cái đầu
  const words = slug.split('-');
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  // Await the params object before using its properties
  const { slug } = await params;
  
  const products = await getProducts();
  const categoryName = formatCategoryName(slug);
  
  // Lọc sản phẩm: lấy những sản phẩm có status là 'active' và có chứa tag (hoặc keyword) tương ứng với slug
  const activeProducts = products.filter(p => p.status === 'active');
  const filteredProducts = activeProducts.filter(p => {
    // Nếu admin gán tag trong Google Sheet (ví dụ: 'thien-nhien', 'Thiên nhiên', 'vfx')
    // Ta kiểm tra xem slug có nằm trong tags không (không phân biệt hoa thường)
    const normalizedTags = p.tags.map(t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'));
    return normalizedTags.includes(slug.toLowerCase()) || 
           p.tags.some(t => t.toLowerCase().includes(slug.toLowerCase()));
  });

  return (
    <div className="container mx-auto px-6 py-12 min-h-[calc(100vh-160px)]">
      {/* Breadcrumb & Header */}
      <div className="mb-12">
        <nav className="flex text-slate-400 text-sm mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-cyan-400 transition-colors">Trang chủ</Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <Link href="/categories" className="hover:text-cyan-400 transition-colors">Thể loại</Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-white font-medium" aria-current="page">
              {categoryName}
            </li>
          </ol>
        </nav>
        
        <div className="flex items-end justify-between border-b border-slate-800/60 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Thể loại: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">{categoryName}</span>
            </h1>
            <p className="text-slate-400">
              Khám phá bộ sưu tập các video chất lượng cao thuộc thể loại {categoryName}.
            </p>
          </div>
          <div className="hidden sm:block text-slate-400 font-medium">
            <span className="text-white text-xl">{filteredProducts.length}</span> Video
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Chưa có video nào</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Hiện tại chưa có video nào được đăng bán trong thể loại <strong className="text-white">{categoryName}</strong>. Vui lòng quay lại sau.
          </p>
          <Link href="/categories" className="inline-flex items-center justify-center px-6 py-3 mt-8 border border-slate-700 rounded-xl bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 hover:border-slate-600 transition-all">
            Xem các thể loại khác
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <VideoCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
