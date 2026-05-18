'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const QuillEditor = dynamic(() => import('@/components/QuillEditor'), {
  ssr: false,
  loading: () => <div className="p-4 border border-gray-200 rounded-md bg-slate-50 text-gray-500 font-mono text-xs">Đang tải trình soạn thảo trực quan...</div>,
});

export default function SettingsPage() {
  const [emailTemplate, setEmailTemplate] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [instructionsMessage, setInstructionsMessage] = useState({ type: '', text: '' });

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
        setPaymentInstructions(data.paymentInstructions || `<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; margin: 15px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 25px; color: #e2e8f0; line-height: 1.6; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
  
  <!-- Cảnh báo quan trọng -->
  <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
    <h4 style="margin: 0 0 8px 0; color: #f87171; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ LƯU Ý QUAN TRỌNG:</h4>
    <p style="margin: 0; font-size: 13.5px; color: #cbd5e1;">Quý Khách có thể tải lại File trong vòng <strong>30 ngày</strong>, sau đó file sẽ được xóa trên hệ thống lưu trữ tạm thời (nếu muốn cấp lại sau thời gian này sẽ phát sinh phí).</p>
  </div>

  <!-- Điều khoản sử dụng -->
  <div style="background-color: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
    <h4 style="margin: 0 0 12px 0; color: #38bdf8; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📜 Điều Khoản Sử Dụng Sản Phẩm (Sở Hữu Trí Tuệ của MrKen):</h4>
    <div style="font-size: 13.5px; color: #94a3b8;">
      <p style="margin: 0 0 10px 0;"><strong style="color: #cbd5e1;">Điều 1:</strong> Sản phẩm này quý khách đã mua sẽ được quyền sử dụng để trình chiếu ở các chương trình/sự kiện của riêng quý khách (bao gồm cấp Cơ Quan / Tổ Chức / Doanh Nghiệp / Cá Nhân).</p>
      <p style="margin: 0 0 10px 0;"><strong style="color: #cbd5e1;">Điều 2:</strong> Quý khách tuyệt đối <strong>KHÔNG</strong> được phát tán, chia sẻ miễn phí hoặc mua bán thương mại lại sản phẩm này dưới mọi hình thức.</p>
      <p style="margin: 0;"><strong style="color: #cbd5e1;">Điều 3:</strong> Nếu quý khách vi phạm điều khoản trên (Điều 2), quý khách sẽ phải đền bù toàn bộ thiệt hại cho MrKen.Media. Tòa Án TP.HCM sẽ là nơi giải quyết tranh chấp pháp lý.</p>
    </div>
  </div>

  <!-- Lời cảm ơn & Chữ ký -->
  <div style="border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 20px;">
    <p style="margin: 0 0 15px 0; font-style: italic; color: #38bdf8; font-size: 14px; font-weight: 600;">Trân Trọng Cảm Ơn Quý Khách!</p>
    
    <!-- Khung thông tin chữ ký -->
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <!-- Logo bên trái -->
        <td style="width: 90px; vertical-align: top; padding-right: 15px;">
          <img src="https://mrkenmedia.com/logo-mrken.png" alt="MrKen.Media Logo" style="width: 80px; height: auto; border-radius: 8px; background-color: #ffffff; padding: 5px;" />
        </td>
        <!-- Thông tin liên hệ bên phải -->
        <td style="vertical-align: top; font-size: 13px; color: #94a3b8; line-height: 1.5;">
          <h4 style="margin: 0 0 2px 0; color: #ffffff; font-size: 15px; font-weight: 700;">Lê Quốc Khánh <span style="font-weight: 400; font-style: italic; font-size: 12px; color: #38bdf8;">(Mr.Ken)</span></h4>
          <p style="margin: 0 0 8px 0; color: #cbd5e1; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Art Director</p>
          
          <p style="margin: 0 0 4px 0;"><strong style="color: #cbd5e1;">MrKen.Media</strong></p>
          <p style="margin: 0 0 4px 0;">📞 Mobile/Zalo: <a href="tel:0898495425" style="color: #38bdf8; text-decoration: none; font-weight: 600;">0898 495 425</a></p>
          <p style="margin: 0 0 4px 0;">✉️ Email: <a href="mailto:mrken.media@gmail.com" style="color: #38bdf8; text-decoration: none;">mrken.media@gmail.com</a></p>
          <p style="margin: 0;">🌐 <a href="https://facebook.com" target="_blank" style="color: #38bdf8; text-decoration: none; margin-right: 10px;">Facebook</a> | <a href="https://youtube.com" target="_blank" style="color: #38bdf8; text-decoration: none;">Youtube</a></p>
        </td>
      </tr>
    </table>
  </div>

</div>`);

        // Cung cấp một template mặc định nếu chưa có
        setEmailTemplate(data.emailTemplate || `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; padding: 40px 20px; color: #334155; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-bottom: 3px solid #0891b2;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">KEN VIDEO STOCK</h1>
      <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Nền Tảng Video 4K Bản Quyền Hàng Đầu</p>
    </div>
    
    <!-- Body Content -->
    <div style="padding: 40px 30px;">
      <p style="margin-top: 0; font-size: 16px;">Xin chào <strong>{{customer_email}}</strong>,</p>
      
      <p style="font-size: 15px;">Cảm ơn bạn đã tin tưởng lựa chọn sản phẩm từ <strong>KenVideo Stock</strong>! Đơn hàng <strong style="color: #0891b2; font-family: monospace;">#{{order_id}}</strong> của bạn đã thanh toán thành công và được xử lý tự động hoàn tất.</p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 25px 0;">
        <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 14px;">
          ⚡ Hệ thống đã cấp quyền truy cập Google Drive gốc thành công cho tài khoản email của bạn!
        </p>
      </div>

      <p style="font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
        🎬 Danh sách file video của bạn:
      </p>
      
      <div style="margin-bottom: 30px;">
        {{product_list}}
      </div>

      <!-- Instructions Section -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 30px;">
        <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase;">💡 Hướng dẫn tải file nhanh:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #475569;">
          <li style="margin-bottom: 8px;">Nhấp vào các liên kết màu xanh ở trên để mở trực tiếp video trên Google Drive.</li>
          <li style="margin-bottom: 8px;">Hoặc bạn có thể truy cập tài khoản Google Drive của mình, tìm mục <strong>"Được chia sẻ với tôi" (Shared with me)</strong> để thấy thư mục chứa file bản quyền.</li>
          <li style="margin-bottom: 0;">Khuyên dùng trình duyệt máy tính để có trải nghiệm xem thử và tải file 4K gốc với tốc độ cao nhất.</li>
        </ul>
      </div>

      <p style="margin-top: 30px; font-size: 14px; text-align: center; color: #64748b;">
        Nếu bạn gặp bất kỳ câu hỏi nào hoặc cần hỗ trợ kỹ thuật, vui lòng phản hồi trực tiếp email này hoặc nhắn tin qua kênh hỗ trợ của chúng tôi.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0 0 5px 0; font-weight: 600; color: #475569;">KEN VIDEO STOCK &copy; 2026</p>
      <p style="margin: 0;">Email: mrken.media@gmail.com | Telegram: @mrkenmedia</p>
    </div>
    
  </div>
</div>`);
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

  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    setInstructionsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'paymentInstructions', value: paymentInstructions }),
      });
      if (res.ok) {
        setInstructionsMessage({ type: 'success', text: 'Đã lưu Hướng dẫn & Ghi chú thành công.' });
      } else {
        setInstructionsMessage({ type: 'error', text: 'Lỗi khi lưu cấu hình.' });
      }
    } catch (error) {
      setInstructionsMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingInstructions(false);
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
            <li className="text-teal-700 font-bold">{`{{product_list}}`} - Danh sách tất cả video đã mua dạng hàng dọc kèm nút Tải (Khuyên dùng khi mua nhiều file)</li>
          </ul>
        </div>

        <div className="mb-12">
          <QuillEditor 
            value={emailTemplate} 
            onChange={setEmailTemplate} 
            style={{ height: '320px' }}
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

      {/* Payment Instructions Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Cấu hình Hướng dẫn / Ghi chú thanh toán (Hiển thị ở Checkout & Success Page)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Nhập hướng dẫn chuyển khoản, cách thức kiểm tra hòm thư, ghi chú bản quyền hoặc chèn hình ảnh hướng dẫn. Cho phép copy/paste ảnh, văn bản thô hoặc mã HTML.
        </p>

        <div className="mb-12">
          <QuillEditor 
            value={paymentInstructions} 
            onChange={setPaymentInstructions} 
            style={{ height: '280px' }}
          />
        </div>

        {instructionsMessage.text && (
          <div className={`p-3 rounded-md mb-4 text-sm font-medium ${instructionsMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {instructionsMessage.text}
          </div>
        )}

        <button 
          onClick={handleSaveInstructions} 
          disabled={savingInstructions}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingInstructions ? 'Đang lưu...' : 'Lưu Hướng dẫn & Ghi chú'}
        </button>
      </div>
    </div>
  );
}
