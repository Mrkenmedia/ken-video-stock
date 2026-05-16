import { getProducts } from '@/lib/google';
import DeleteButton from './DeleteButton';

export const revalidate = 0; // Tạm thời disable cache cho trang Admin để lấy dữ liệu real-time

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lưu ý: Dữ liệu được đồng bộ trực tiếp từ Google Sheets. Để thêm/sửa/xóa, vui lòng thao tác trên file Sheets.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a 
            href={`https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm transition font-medium"
          >
            Mở Google Sheets
          </a>
          <a 
            href="/admin/products/batch" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Nhập hàng loạt
          </a>
          <a 
            href="/admin/products/new" 
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md shadow-sm transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Thêm 1 Video
          </a>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Video</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá Bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Nguồn</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Chưa có sản phẩm nào hoặc chưa kết nối Google Sheets thành công.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.sku} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[200px] break-all">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="h-10 w-16 bg-gray-200 rounded overflow-hidden mr-3 shrink-0 mt-1">
                        {product.thumbnailUrl ? (
                          <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : product.driveDemoId ? (
                          <img src={`https://drive.google.com/thumbnail?id=${product.driveDemoId}&sz=w200`} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-gray-400">No Img</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 break-words">{product.name}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.tags.join(', ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>MP4: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMp4)}</div>
                    {product.priceMov > 0 && (
                      <div className="text-xs text-gray-500">MOV: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMov)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${product.driveDemoId ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={product.driveDemoId ? 'text-gray-700' : 'text-red-500'}>Demo {product.driveDemoId ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${product.driveGocMp4Id ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                        <span className={product.driveGocMp4Id ? 'text-gray-700' : 'text-gray-400'}>MP4 {product.driveGocMp4Id ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${product.driveGocMovId ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                        <span className={product.driveGocMovId ? 'text-gray-700' : 'text-gray-400'}>MOV {product.driveGocMovId ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end">
                      <a href={`/admin/products/${product.sku}/edit`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors inline-block">
                        Sửa
                      </a>
                      <DeleteButton sku={product.sku} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
