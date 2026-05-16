'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Tải ReactQuill động để tránh lỗi SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function SettingsPage() {
  const [emailTemplate, setEmailTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
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

  // Cấu hình thanh công cụ của ReactQuill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Hệ thống</h1>
      
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

        <div className="mb-6 bg-white">
          <ReactQuill 
            theme="snow" 
            value={emailTemplate} 
            onChange={setEmailTemplate} 
            modules={modules}
            className="h-96 mb-12"
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
