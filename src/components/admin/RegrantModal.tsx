'use client';

import { useState, useRef, useEffect } from 'react';

interface RegrantModalProps {
  orderId: string;
  originalEmail: string;
  sku: string;
  format: string;
  onClose: () => void;
}

export default function RegrantModal({
  orderId,
  originalEmail,
  sku,
  format,
  onClose,
}: RegrantModalProps) {
  const [emailInput, setEmailInput] = useState(originalEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    results?: { email: string; success: boolean }[];
  } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Đóng modal khi click ngoài
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    const emails = emailInput
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      alert('Vui lòng nhập ít nhất một email hợp lệ.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/orders/regrant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, emails }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message, results: data.results });
      } else {
        setResult({ success: false, message: data.error || 'Có lỗi xảy ra.' });
      }
    } catch {
      setResult({ success: false, message: 'Không kết nối được server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🔄 Cấp lại File</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Đơn hàng: <span className="font-mono font-semibold text-teal-700">{orderId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition text-xl leading-none"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
          <div className="flex gap-2">
            <span className="text-gray-500 w-24">Sản phẩm:</span>
            <span className="font-medium text-gray-800">{sku}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24">Định dạng:</span>
            <span className="font-medium text-gray-800">{format}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24">Email gốc:</span>
            <span className="font-medium text-gray-800 break-all">{originalEmail}</span>
          </div>
        </div>

        {/* Email Input */}
        {!result && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email nhận quyền{' '}
              <span className="text-gray-400 font-normal">(nhiều email phân cách bằng dấu phẩy)</span>
            </label>
            <textarea
              id="regrant-email-input"
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition"
              placeholder="email1@gmail.com, email2@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Xóa email cũ và nhập email mới nếu cần thay đổi. Admin có thể cấp cho nhiều người cùng lúc.
            </p>
          </>
        )}

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl p-4 mb-4 text-sm ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className={`font-semibold mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? '✅ ' : '❌ '}{result.message}
            </p>
            {result.results && (
              <ul className="space-y-1">
                {result.results.map((r) => (
                  <li key={r.email} className="flex items-center gap-2">
                    <span>{r.success ? '✅' : '❌'}</span>
                    <span className={r.success ? 'text-green-800' : 'text-red-800'}>{r.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            {result ? 'Đóng' : 'Hủy'}
          </button>
          {!result && (
            <button
              id="regrant-confirm-btn"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận Cấp File'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
