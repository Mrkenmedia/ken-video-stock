"use client";

import { useState } from 'react';
import Link from 'next/link';
import { scanDriveFolderAndImport } from './actions';

export default function BatchImportPage() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; count?: number } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const res = await scanDriveFolderAndImport(formData);
      setResult(res);
      if (res.success) {
        form.reset(); // Xóa form nếu thành công
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Lỗi không xác định.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nhập Liệu Hàng Loạt Từ Google Drive</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống tự động quét thư mục Drive, ghép nối file Demo/MP4/MOV và đồng bộ vào Google Sheets.
          </p>
        </div>
        <Link 
          href="/admin/products"
          className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 bg-gray-100 rounded-md transition"
        >
          Quay lại
        </Link>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {result.success ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <div>
            <p className="font-medium">{result.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Cấu hình Google Drive */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">1. Thư mục Google Drive</h3>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800">
              <strong>Yêu cầu cấu trúc thư mục:</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Trong thư mục gốc phải có 3 thư mục con chứa từ khóa: <strong>DEMO</strong>, <strong>MP4</strong>, <strong>MOV</strong></li>
                <li>Tên file trong thư mục con kết thúc bằng: <strong>_Demo</strong>, <strong>_Mp4</strong>, <strong>_Mov</strong> (VD: Sunset_Demo.mp4, Sunset_Mp4.mp4)</li>
                <li>App sẽ dùng phần tên trước dấu gạch dưới (VD: Sunset) để làm SKU và Tên Sản phẩm.</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link Thư mục Drive Gốc *</label>
              <input required type="url" name="folderUrl" placeholder="https://drive.google.com/drive/folders/1abc..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
            </div>
          </div>

          {/* Cấu hình Đồng loạt */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">2. Áp dụng đồng loạt cho tất cả video</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá MP4 Chung (VNĐ) *</label>
                <input required type="number" name="priceMp4" defaultValue="150000" min="0" step="1000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá MOV Chung (VNĐ) *</label>
                <input required type="number" name="priceMov" defaultValue="250000" min="0" step="1000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Gán nhãn Thể loại / Từ khóa (Cách nhau bằng dấu phẩy)</label>
                <input type="text" name="tags" placeholder="VD: thien-nhien, phong-canh, flycam" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái đăng bán</label>
                <select name="status" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white">
                  <option value="active" className="text-gray-900">Đăng bán ngay (Active)</option>
                  <option value="inactive" className="text-gray-900">Lưu nháp / Tạm ẩn (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="submit"
              disabled={pending}
              className={`px-8 py-3 rounded-lg text-white font-medium transition-colors shadow-sm flex items-center gap-2 ${
                pending ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {pending && (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {pending ? 'Đang quét và đồng bộ...' : 'Bắt đầu Nhập liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
