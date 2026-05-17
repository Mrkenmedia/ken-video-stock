"use client";

import { useState } from 'react';
import { Product } from '@/types';
import DeleteButton from './DeleteButton';
import { editProduct } from './actions';
import SubmitButton from './SubmitButton';
import { generateIdFromSku } from '@/lib/utils';

interface ProductsManagerProps {
  initialProducts: Product[];
  tags: string[];
  googleSheetId?: string;
}

export default function ProductsManager({ initialProducts, tags, googleSheetId }: ProductsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter products by SKU, Name, Tags, or Auto-generated ID
  const filteredProducts = initialProducts.filter((product) => {
    const term = searchQuery.toLowerCase();
    return (
      product.sku.toLowerCase().includes(term) ||
      product.name.toLowerCase().includes(term) ||
      generateIdFromSku(product.sku).toLowerCase().includes(term) ||
      product.tags.some(t => t.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lưu ý: Dữ liệu được đồng bộ trực tiếp từ Google Sheets. Để thêm/sửa/xóa, vui lòng thao tác trên giao diện hoặc Sheets.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {googleSheetId && (
            <a 
              href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm transition font-medium text-sm flex items-center justify-center"
            >
              Mở Google Sheets
            </a>
          )}
          <a 
            href="/admin/products/batch" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Nhập hàng loạt
          </a>
          <a 
            href="/admin/products/new" 
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md shadow-sm transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Thêm 1 Video
          </a>
        </div>
      </div>

      {/* Search Bar & Tabs */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            placeholder="Tìm SKU, tên video, thể loại..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        {totalPages > 1 && (
          <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl max-w-full overflow-x-auto">
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1;
              const start = i * itemsPerPage + 1;
              const end = Math.min((i + 1) * itemsPerPage, filteredProducts.length);
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Tab {pageNum} ({start} - {end})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[60px]">STT</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Video</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá Bán</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">File Nguồn</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  {searchQuery ? 'Không tìm thấy video nào phù hợp.' : 'Chưa có sản phẩm nào.'}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product, index) => (
                <tr key={product.sku} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-500 font-mono">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-[200px] break-all font-mono">
                    <div className="font-semibold text-gray-900">{product.sku}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">ID: {product.id || generateIdFromSku(product.sku)}</span>
                      {product.stt && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">STT: {product.stt}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="h-10 w-16 bg-gray-100 border border-gray-200 rounded overflow-hidden mr-3 shrink-0 mt-1">
                        {(() => {
                          const driveThumbId = product.driveDemoId || product.driveGocMp4Id || product.driveGocMovId;
                          if (product.thumbnailUrl) {
                            return <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-cover" />;
                          }
                          if (driveThumbId) {
                            return <img src={`https://drive.google.com/thumbnail?id=${driveThumbId}&sz=w200`} alt={product.name} className="h-full w-full object-cover" />;
                          }
                          return <span className="flex h-full items-center justify-center text-xs text-gray-400">No Img</span>;
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 break-words line-clamp-1">{product.name}</div>
                        <div className="text-xs text-gray-400 line-clamp-2 mt-0.5">{product.tags.join(', ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium text-teal-600">MP4: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMp4)}</div>
                    {product.priceMov > 0 && (
                      <div className="text-xs text-gray-500 font-medium">MOV: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMov)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${product.driveDemoId ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={product.driveDemoId ? 'text-gray-600 font-medium' : 'text-red-500 font-medium'}>Demo {product.driveDemoId ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${product.driveGocMp4Id ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                        <span className={product.driveGocMp4Id ? 'text-gray-600 font-medium' : 'text-gray-400 font-medium'}>MP4 {product.driveGocMp4Id ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${product.driveGocMovId ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                        <span className={product.driveGocMovId ? 'text-gray-600 font-medium' : 'text-gray-400 font-medium'}>MOV {product.driveGocMovId ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingProduct(product)} 
                        className="text-teal-600 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-md transition-colors text-sm font-medium"
                      >
                        Sửa
                      </button>
                      <DeleteButton sku={product.sku} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Product Popup Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa Video</h2>
                <p className="text-xs text-gray-500 mt-1">SKU: <span className="font-mono text-teal-600 font-semibold">{editingProduct.sku}</span></p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Form */}
            <form action={editProduct} className="p-6 md:p-8 space-y-6">
              <input type="hidden" name="originalSku" value={editingProduct.sku} />

              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 border-b pb-1.5">1. Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Video *</label>
                    <input required type="text" name="name" defaultValue={editingProduct.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã ID</label>
                    <input type="text" name="id" defaultValue={editingProduct.id || ""} placeholder="Tự động sinh" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số thứ tự (STT)</label>
                    <input type="number" name="stt" defaultValue={editingProduct.stt || ""} placeholder="VD: 1, 2, 3" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ khóa (Tags)</label>
                    <div className="bg-white p-3.5 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                      {tags.length === 0 ? (
                        <p className="text-gray-400 text-xs italic">Chưa có Thể loại nào.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {tags.map((tag) => (
                            <label key={tag} className="flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-teal-600">
                              <input 
                                type="checkbox" 
                                name="tags" 
                                value={tag} 
                                defaultChecked={editingProduct.tags.includes(tag)}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4" 
                              />
                              <span className="text-xs font-semibold">{tag}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1.5: Mô tả & Thông số chi tiết */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 border-b pb-1.5">2. Mô tả & Thông số chi tiết</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả Video *</label>
                    <textarea required name="description" defaultValue={editingProduct.description} placeholder="Nhập mô tả chi tiết cho video..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Độ phân giải</label>
                      <input type="text" name="resolution" defaultValue={editingProduct.resolution || "4K Ultra HD"} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng</label>
                      <input type="text" name="duration" defaultValue={editingProduct.duration || ""} placeholder="VD: 0:15" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Khung hình / FPS</label>
                      <input type="text" name="fps" defaultValue={editingProduct.fps || "60 FPS"} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dung lượng file</label>
                      <input type="text" name="size" defaultValue={editingProduct.size || ""} placeholder="VD: ~50MB" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Media & ID Google Drive */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 border-b pb-1.5">3. Liên kết Media</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Ảnh Thumbnail (Tùy chọn - Bỏ trống để tự động lấy ảnh từ video Google Drive)</label>
                    <input type="url" name="thumbnailUrl" defaultValue={editingProduct.thumbnailUrl} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive ID - Video Demo *</label>
                    <input required type="text" name="driveDemoId" defaultValue={editingProduct.driveDemoId} placeholder="VD: 1Bxy..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-mono text-sm text-gray-900 bg-white" />
                  </div>
                </div>
              </div>

              {/* Section 3: Bán hàng */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 border-b pb-1.5">4. Định dạng & Giá bán</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {/* MP4 */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-sm">Định dạng MP4</h4>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Giá MP4 (VNĐ) *</label>
                      <input required type="number" name="priceMp4" defaultValue={editingProduct.priceMp4} min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Drive ID - File Gốc MP4</label>
                      <input type="text" name="driveGocMp4Id" defaultValue={editingProduct.driveGocMp4Id} placeholder="Bỏ trống nếu không có MP4" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-mono text-xs text-gray-900 bg-white" />
                    </div>
                  </div>

                  {/* MOV */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-sm">Định dạng MOV</h4>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Giá MOV (VNĐ)</label>
                      <input type="number" name="priceMov" defaultValue={editingProduct.priceMov} min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Drive ID - File Gốc MOV</label>
                      <input type="text" name="driveGocMovId" defaultValue={editingProduct.driveGocMovId} placeholder="Bỏ trống nếu không có MOV" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-mono text-xs text-gray-900 bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Cài đặt khác */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 border-b pb-1.5">5. Cài đặt khác</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại Giấy phép</label>
                    <select name="licenseType" defaultValue={editingProduct.licenseType} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm">
                      <option value="Standard">Standard License</option>
                      <option value="Extended">Extended License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hiển thị</label>
                    <select name="status" defaultValue={editingProduct.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white text-sm">
                      <option value="active">Đang bán (Active)</option>
                      <option value="inactive">Tạm ẩn (Inactive)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-5 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
                <SubmitButton pendingText="Đang lưu..." text="Lưu thay đổi" />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
