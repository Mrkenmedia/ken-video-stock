import Link from 'next/link';
import { BRAND_CONFIG } from '@/config/brand';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const linkClass = 'block px-4 py-2 rounded hover:bg-gray-800 transition';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
            <img 
              src={BRAND_CONFIG.logo.src} 
              alt={BRAND_CONFIG.logo.alt} 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-black tracking-tight text-teal-400 uppercase truncate">
            {BRAND_CONFIG.name}
          </span>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <Link href="/admin" className={linkClass}>
            Tổng quan (Dashboard)
          </Link>
          <Link href="/admin/products" className={linkClass}>
            Quản lý Kho (Products)
          </Link>
          <Link href="/admin/orders" className={linkClass}>
            Đơn Hàng (Orders)
          </Link>
          <Link href="/admin/tags" className={linkClass}>
            Thể Loại (Tags)
          </Link>
          <Link href="/admin/coupons" className={linkClass}>
            Mã Giảm Giá
          </Link>
          <Link href="/admin/banners" className={linkClass}>
            Quản lý Banner (Carousel)
          </Link>
          <Link href="/admin/collections" className={linkClass}>
            Quản lý Bộ Sưu Tập
          </Link>
          <Link href="/admin/promotions" className={linkClass}>
            Khuyến Mãi & Banner
          </Link>
          <Link href="/admin/settings" className={linkClass}>
            Cài đặt Hệ thống
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Bảng Điều Khiển</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Admin</span>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-100">
              <img 
                src={BRAND_CONFIG.logo.src} 
                alt={BRAND_CONFIG.logo.alt} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
