'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [emailTemplate, setEmailTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [globalDiscountPercent, setGlobalDiscountPercent] = useState('0');
  const [globalDiscountStart, setGlobalDiscountStart] = useState('');
  const [globalDiscountEnd, setGlobalDiscountEnd] = useState('');
  const [newUserFlashSalePercent, setNewUserFlashSalePercent] = useState('0');
  const [newUserFlashSaleDuration, setNewUserFlashSaleDuration] = useState('0');
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        
        setGlobalDiscountPercent(data.globalDiscountPercent || '0');
        setGlobalDiscountStart(data.globalDiscountStart || '');
        setGlobalDiscountEnd(data.globalDiscountEnd || '');
        setNewUserFlashSalePercent(data.newUserFlashSalePercent || '0');
        setNewUserFlashSaleDuration(data.newUserFlashSaleDuration || '0');

        // Cung cấp một template mặc định nếu chưa có
        setEmailTemplate(data.emailTemplate || `<p>Xin chào <strong>{{customer_email}}</strong>,</p>
<p>Cám ơn bạn đã mua video <strong>{{product_name}}</strong> ({{sku}}).</p>
<p>Hệ thống đã tự động cấp quyền truy cập vào Google Drive của bạn. Bạn có thể xem và tải file gốc tại đây:</p>
<p><a href="{{drive_link}}" target="_blank">Thư mục Google Drive</a></p>
<p>Nếu bạn cần hỗ trợ, vui lòng phản hồi lại email này.</p>
<p>Trân trọng,<br>KenVideo Team</p>`);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setMessage({ type: 'error', text: 'Lỗi tải cấu hình.' });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'emailTemplate', value: emailTemplate }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã lưu cấu hình Email thành công.' });
      } else {
        setMessage({ type: 'error', text: 'Lỗi khi lưu cấu hình.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDiscount = async () => {
    setSavingDiscount(true);
    setDiscountMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            globalDiscountPercent,
            globalDiscountStart,
            globalDiscountEnd,
            newUserFlashSalePercent,
            newUserFlashSaleDuration,
          }
        }),
      });
      if (res.ok) {
        setDiscountMessage({ type: 'success', text: 'Đã lưu cấu hình Khuyến mãi & Flash Sale thành công.' });
      } else {
        setDiscountMessage({ type: 'error', text: 'Lỗi khi lưu cấu hình.' });
      }
    } catch (error) {
      setDiscountMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingDiscount(false);
    }
  };



  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Hệ thống</h1>
      
      {/* Global Discount Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Chương trình Khuyến mãi Toàn sàn (Giảm giá toàn bộ Video)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Thiết lập mức giảm giá phần trăm (%) áp dụng tự động cho toàn bộ sản phẩm trên trang bán hàng. Bạn có thể cài đặt chính xác khung thời gian bắt đầu và kết thúc (theo giờ, ngày).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mức giảm giá (%)</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                min="0"
                max="100"
                value={globalDiscountPercent}
                onChange={(e) => setGlobalDiscountPercent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                placeholder="Ví dụ: 20"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Để 0 nếu muốn tắt chương trình giảm giá.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian bắt đầu</label>
            <input
              type="datetime-local"
              value={globalDiscountStart}
              onChange={(e) => setGlobalDiscountStart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Bỏ trống để áp dụng ngay lập tức.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian kết thúc</label>
            <input
              type="datetime-local"
              value={globalDiscountEnd}
              onChange={(e) => setGlobalDiscountEnd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Bỏ trống để chạy vô thời hạn.</p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-6" />

        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Chương trình Flash Sale Người dùng mới (New User Flash Sale)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Kích hoạt giảm giá hấp dẫn có thời hạn (Countdown Timer) khi khách hàng mới truy cập website lần đầu tiên, thôi thúc họ đặt hàng nhanh chóng.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mức giảm giá Flash Sale (%)</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                min="0"
                max="100"
                value={newUserFlashSalePercent}
                onChange={(e) => setNewUserFlashSalePercent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                placeholder="Ví dụ: 25"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Để 0 nếu muốn tắt chương trình Flash Sale người dùng mới.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng Flash Sale (Phút)</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                min="1"
                value={newUserFlashSaleDuration}
                onChange={(e) => setNewUserFlashSaleDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                placeholder="Ví dụ: 30"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">phút</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Khoảng thời gian đếm ngược (phút) chạy cho mỗi khách hàng mới.</p>
          </div>
        </div>

        {discountMessage.text && (
          <div className={`p-3 rounded-md mb-6 text-sm font-medium ${discountMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {discountMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveDiscount}
          disabled={savingDiscount}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2 mb-4"
        >
          {savingDiscount ? 'Đang lưu...' : 'Lưu cấu hình Khuyến mãi'}
        </button>
      </div>

      {/* Email Template Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cấu hình Email tự động (Sau thanh toán)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Bạn có thể soạn thảo, chèn hình ảnh, logo, hoặc copy/paste từ Word/Mail khác vào đây. Định dạng sẽ được giữ nguyên.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Các biến số có thể dùng (Copy và dán vào nội dung):</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside font-mono">
            <li>{`{{order_id}}`} - Mã đơn hàng</li>
            <li>{`{{customer_email}}`} - Email của khách</li>
            <li>{`{{product_name}}`} - Tên sản phẩm</li>
            <li>{`{{sku}}`} - Mã SKU</li>
            <li>{`{{format}}`} - Định dạng (MP4/MOV)</li>
            <li>{`{{drive_link}}`} - Link thư mục Drive chia sẻ</li>
          </ul>
        </div>

        <div className="mb-6">
          <textarea 
            value={emailTemplate} 
            onChange={(e) => setEmailTemplate(e.target.value)} 
            className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
            placeholder="Nhập nội dung HTML hoặc văn bản thường vào đây..."
          />
        </div>

        {message.text && (
          <div className={`p-3 rounded-md mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? 'Đang lưu...' : 'Lưu Template Email'}
        </button>
      </div>
    </div>
  );
}
