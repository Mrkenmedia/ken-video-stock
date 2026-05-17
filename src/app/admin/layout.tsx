import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const linkClass = 'block px-4 py-2 rounded hover:bg-gray-800 transition';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-teal-400">KEN ADMIN</h1>
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
          <Link href="/admin/settings" className={linkClass}>
            Cài đặt &amp; Khuyến Mãi
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Bảng Điều Khiển</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Admin</span>
            <div className="h-8 w-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">
              K
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
