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

  // ─ Màu nút Chi tiết ──────────────────────────────────────────────────────
  const [detailButtonColor, setDetailButtonColor] = useState('#6366f1');
  const [detailButtonTextColor, setDetailButtonTextColor] = useState('#ffffff');
  const [savingBtnColor, setSavingBtnColor] = useState(false);
  const [btnColorMessage, setBtnColorMessage] = useState({ type: '', text: '' });
  // ───────────────────────────────────────────────────────────────

  // ─ Footer Text ─────────────────────────────────────────────────────────────
  const [footerCopyright, setFooterCopyright] = useState(`© ${new Date().getFullYear()} MrKen Media. All rights reserved.`);
  const [footerSubtext, setFooterSubtext] = useState('Tối ưu hóa bởi Google Drive & Next.js');
  const [savingFooter, setSavingFooter] = useState(false);
  const [footerMessage, setFooterMessage] = useState({ type: '', text: '' });
  // ───────────────────────────────────────────────────────────────

  // ─ General & UI Settings ───────────────────────────────────────────────────
  const [enableTelegramVisitorAlerts, setEnableTelegramVisitorAlerts] = useState(true);
  const [tagFontSize, setTagFontSize] = useState('14px');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMessage, setGeneralMessage] = useState({ type: '', text: '' });
  // ───────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        
        if (data.detailButtonColor) setDetailButtonColor(data.detailButtonColor);
        if (data.detailButtonTextColor) setDetailButtonTextColor(data.detailButtonTextColor);
        if (data.footerCopyright) setFooterCopyright(data.footerCopyright);
        if (data.footerSubtext) setFooterSubtext(data.footerSubtext);
        if (data.enableTelegramVisitorAlerts !== undefined) setEnableTelegramVisitorAlerts(data.enableTelegramVisitorAlerts);
        if (data.tagFontSize) setTagFontSize(data.tagFontSize);

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

  const handleSaveBtnColor = async () => {
    setSavingBtnColor(true);
    setBtnColorMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { detailButtonColor, detailButtonTextColor },
        }),
      });
      if (res.ok) {
        setBtnColorMessage({ type: 'success', text: 'Đã lưu màu nút Chi tiết thành công. Reload trang storefront để thấy hiệu ứng.' });
      } else {
        setBtnColorMessage({ type: 'error', text: 'Lỗi khi lưu.' });
      }
    } catch {
      setBtnColorMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingBtnColor(false);
    }
  };

  const handleSaveFooter = async () => {
    setSavingFooter(true);
    setFooterMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { footerCopyright, footerSubtext },
        }),
      });
      if (res.ok) {
        setFooterMessage({ type: 'success', text: 'Đã lưu nội dung Footer thành công. Reload trang chủ để thấy thay đổi.' });
      } else {
        setFooterMessage({ type: 'error', text: 'Lỗi khi lưu.' });
      }
    } catch {
      setFooterMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingFooter(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setGeneralMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { enableTelegramVisitorAlerts, tagFontSize },
        }),
      });
      if (res.ok) {
        setGeneralMessage({ type: 'success', text: 'Đã lưu cấu hình chung thành công. Reload trang để thấy thay đổi.' });
      } else {
        setGeneralMessage({ type: 'error', text: 'Lỗi khi lưu.' });
      }
    } catch {
      setGeneralMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingGeneral(false);
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Hệ thống</h1>

      {/* ── Cài đặt Chung ─────────────────────────────────────────────────── */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Cấu hình Chung
        </h2>
        
        <div className="space-y-6 mb-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">Thông báo lượt truy cập mới (Telegram)</label>
              <p className="text-xs text-gray-500 mt-1">Nhận tin nhắn mỗi khi có khách hàng truy cập website (chỉ nhận 1 lần/khách để tránh spam).</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={enableTelegramVisitorAlerts}
                onChange={(e) => setEnableTelegramVisitorAlerts(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          <div className="pb-2">
            <label className="block text-sm font-medium text-gray-800 mb-2">Cỡ chữ Thẻ phân loại (Tags) trên Trang chủ</label>
            <div className="flex items-center gap-4">
              <select 
                value={tagFontSize}
                onChange={(e) => setTagFontSize(e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="12px">Nhỏ (12px)</option>
                <option value="14px">Vừa (14px) - Mặc định</option>
                <option value="16px">Lớn (16px)</option>
                <option value="18px">Rất Lớn (18px)</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2">Ví dụ: 12px, 14px, 16px. Ảnh hưởng đến thanh danh mục nằm ngang.</p>
          </div>
        </div>

        {generalMessage.text && (
          <div className={`p-3 rounded-md mb-4 text-sm font-medium ${generalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {generalMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveGeneral}
          disabled={savingGeneral}
          className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingGeneral ? 'Đang lưu...' : 'Lưu Cấu hình Chung'}
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

      {/* ── Tùy chỉnh Giao diện: Màu nút Chi tiết ───────────────────────────── */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-purple-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          Tùy chỉnh giao diện — Nút “Xem Chi Tiết” trên Trang chủ
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Chọn màu nền và màu chữ cho nút <strong>“Chi tiết”</strong> hiển thị trên mỗi card video ở trang chủ. Thay đổi có hiệu lực ngay khi khách hàng reload lại trang.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Màu nền */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Màu nền nút</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={detailButtonColor.startsWith('#') ? detailButtonColor : '#6366f1'}
                onChange={(e) => setDetailButtonColor(e.target.value)}
                className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
                title="Chọn màu nền"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={detailButtonColor}
                  onChange={(e) => setDetailButtonColor(e.target.value)}
                  placeholder="#6366f1 hoặc gradient CSS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Nhập mã HEX, rgba() hoặc gradient CSS (ví dụ: <code>linear-gradient(135deg,#f59e0b,#d97706)</code>)</p>
              </div>
            </div>
          </div>

          {/* Màu chữ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Màu chữ nút</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={detailButtonTextColor.startsWith('#') ? detailButtonTextColor : '#ffffff'}
                onChange={(e) => setDetailButtonTextColor(e.target.value)}
                className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
                title="Chọn màu chữ"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={detailButtonTextColor}
                  onChange={(e) => setDetailButtonTextColor(e.target.value)}
                  placeholder="#ffffff"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview nút */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Xem trước:</p>
          <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
            <button
              style={{
                background: detailButtonColor,
                color: detailButtonTextColor,
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                border: 'none',
                cursor: 'default',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              Chi tiết
            </button>
            <span className="text-xs text-slate-400">← Nút sẽ trông như thế này trên card video</span>
          </div>
        </div>

        {/* Preset nhanh */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Chọn nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Indigo (mặc định)', bg: '#6366f1', text: '#ffffff' },
              { label: 'Cyan', bg: '#0891b2', text: '#ffffff' },
              { label: 'Amber Gold', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', text: '#1c0a00' },
              { label: 'Rose', bg: '#e11d48', text: '#ffffff' },
              { label: 'Emerald', bg: '#059669', text: '#ffffff' },
              { label: 'Slate', bg: '#475569', text: '#ffffff' },
              { label: 'Purple Grad', bg: 'linear-gradient(135deg,#7c3aed,#a855f7)', text: '#ffffff' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setDetailButtonColor(preset.bg); setDetailButtonTextColor(preset.text); }}
                style={{ background: preset.bg, color: preset.text }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-white/10 hover:scale-105 transition-transform"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {btnColorMessage.text && (
          <div className={`p-3 rounded-md mb-4 text-sm font-medium ${btnColorMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {btnColorMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveBtnColor}
          disabled={savingBtnColor}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingBtnColor ? 'Đang lưu...' : 'Lưu màu nút Chi tiết'}
        </button>
      </div>

      {/* ── Tùy chỉnh Footer ───────────────────────────────────────────────── */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-cyan-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h18" /></svg>
          Tùy chỉnh Footer — Chân trang
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Thay đổi nội dung bản quyền và dòng phụ hiển thị ở cuối trang web. Áp dụng cho mọi trang khách hàng truy cập.
        </p>

        <div className="space-y-4 mb-6">
          {/* Dòng bản quyền */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dòng bản quyền (copyright)</label>
            <input
              type="text"
              value={footerCopyright}
              onChange={(e) => setFooterCopyright(e.target.value)}
              placeholder={`© ${new Date().getFullYear()} MrKen Media. All rights reserved.`}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ví dụ: © 2026 MrKen Media. All rights reserved.</p>
          </div>

          {/* Dòng phụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dòng phụ (subtext)</label>
            <input
              type="text"
              value={footerSubtext}
              onChange={(e) => setFooterSubtext(e.target.value)}
              placeholder="Tối ưu hóa bởi Google Drive & Next.js"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ví dụ: Powered by Google Drive & Next.js</p>
          </div>
        </div>

        {/* Preview Footer */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Xem trước:</p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 text-center">
            <p className="text-slate-400 text-sm">{footerCopyright}</p>
            <p className="text-slate-400 text-sm mt-2">{footerSubtext}</p>
          </div>
        </div>

        {footerMessage.text && (
          <div className={`p-3 rounded-md mb-4 text-sm font-medium ${footerMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {footerMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveFooter}
          disabled={savingFooter}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingFooter ? 'Đang lưu...' : 'Lưu nội dung Footer'}
        </button>
      </div>
    </div>
  );
}
