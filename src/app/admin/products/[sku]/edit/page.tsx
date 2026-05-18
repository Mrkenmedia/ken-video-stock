import { getProducts, getTags } from '@/lib/google';
import { editProduct } from '../../actions';
import Link from 'next/link';
import SubmitButton from '../../SubmitButton';

export default async function EditProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const resolvedParams = await params;
  const sku = decodeURIComponent(resolvedParams.sku);
  const [products, tags] = await Promise.all([
    getProducts(),
    getTags()
  ]);
  const product = products.find(p => p.sku === sku);

  if (!product) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Không tìm thấy sản phẩm</h2>
        <p>Mã SKU "{sku}" không tồn tại trong hệ thống.</p>
        <Link href="/admin/products" className="text-teal-600 hover:underline mt-4 inline-block">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sửa Video: {product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            SKU: <span className="font-mono text-teal-600 font-medium">{product.sku}</span>
          </p>
        </div>
        <Link 
          href="/admin/products"
          className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 bg-gray-100 rounded-md transition"
        >
          Hủy bỏ
        </Link>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <form action={editProduct} className="p-8 space-y-8">
          <input type="hidden" name="originalSku" value={product.sku} />
          
          {/* Section 1: Thông tin cơ bản */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Video *</label>
                <input required type="text" name="name" defaultValue={product.name} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Từ khóa (Tags)</label>
                <div className="bg-white p-4 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {tags.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có Thể loại nào. Hãy tạo trong quản lý Thể loại.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {tags.map((tag) => (
                        <label key={tag} className="flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-teal-600">
                          <input 
                            type="checkbox" 
                            name="tags" 
                            value={tag} 
                            defaultChecked={product.tags.includes(tag)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          <span className="text-sm font-medium">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1.5: Mô tả & Thông số chi tiết */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Mô tả & Thông số chi tiết</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả Video *</label>
                <textarea required name="description" defaultValue={product.description} placeholder="Nhập mô tả chi tiết cho video..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ phân giải</label>
                  <input type="text" name="resolution" defaultValue={product.resolution || "4K Ultra HD"} placeholder="VD: 4K Ultra HD" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng</label>
                  <input type="text" name="duration" defaultValue={product.duration || ""} placeholder="VD: 0:15" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Khung hình / FPS</label>
                  <input type="text" name="fps" defaultValue={product.fps || "60 FPS"} placeholder="VD: 60 FPS" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dung lượng file</label>
                  <input type="text" name="size" defaultValue={product.size || ""} placeholder="VD: ~50MB" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Media & ID Google Drive */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Liên kết Media</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Ảnh Thumbnail (Để trống sẽ tự lấy từ Demo ID)</label>
                <input type="url" name="thumbnailUrl" defaultValue={product.thumbnailUrl} placeholder="https://..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video Demo - Google Drive ID hoặc YouTube URL (Bắt buộc) *</label>
                <input required type="text" name="driveDemoId" defaultValue={product.driveDemoId} placeholder="Drive ID: 1Bxy...  |  YouTube: https://youtu.be/..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-mono text-sm text-gray-900 bg-white" />
                <p className="mt-1.5 text-xs text-gray-400">Hỗ trợ: Google Drive ID, link Drive đầy đủ, link YouTube (watch / youtu.be / shorts)</p>
              </div>
            </div>
          </div>

          {/* Section 3: Bán hàng */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Định dạng & Giá bán</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {/* MP4 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Định dạng MP4</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá MP4 (VNĐ) *</label>
                  <input required type="number" name="priceMp4" defaultValue={product.priceMp4} min="0" step="1000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Drive ID - File Gốc MP4</label>
                  <input type="text" name="driveGocMp4Id" defaultValue={product.driveGocMp4Id} placeholder="Bỏ trống nếu không có MP4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-mono text-sm text-gray-900 bg-white" />
                </div>
              </div>

              {/* MOV */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Định dạng MOV</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá MOV (VNĐ)</label>
                  <input type="number" name="priceMov" defaultValue={product.priceMov} min="0" step="1000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Drive ID - File Gốc MOV</label>
                  <input type="text" name="driveGocMovId" defaultValue={product.driveGocMovId} placeholder="Bỏ trống nếu không có MOV" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-mono text-sm text-gray-900 bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Cài đặt khác */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Cài đặt khác</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Giấy phép</label>
                <select name="licenseType" defaultValue={product.licenseType} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white">
                  <option value="Standard" className="text-gray-900">Standard License</option>
                  <option value="Extended" className="text-gray-900">Extended License</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái hiển thị</label>
                <select name="status" defaultValue={product.status} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white">
                  <option value="active" className="text-gray-900">Đang bán (Active)</option>
                  <option value="inactive" className="text-gray-900">Tạm ẩn (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
            <SubmitButton pendingText="Đang lưu..." text="Lưu thay đổi" />
          </div>
        </form>
      </div>
    </div>
  );
}
