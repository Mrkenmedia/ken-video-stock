'use client';

import { useState, useEffect } from 'react';

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true);
  
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState('0');
  const [globalDiscountStart, setGlobalDiscountStart] = useState('');
  const [globalDiscountEnd, setGlobalDiscountEnd] = useState('');
  const [newUserFlashSalePercent, setNewUserFlashSalePercent] = useState('0');
  const [newUserFlashSaleDuration, setNewUserFlashSaleDuration] = useState('0');
  
  const [tierPopupEnabled, setTierPopupEnabled] = useState('false');
  const [tierPopupTitle, setTierPopupTitle] = useState('🎁 Ưu đãi độc quyền hôm nay!');
  const [tierPopupDescription, setTierPopupDescription] = useState('Mua càng nhiều, giảm càng sâu. Giảm thêm lên tới {maxTier}% khi mua số lượng lớn!');
  const [tierPopupColor, setTierPopupColor] = useState('cyan');
  const [tierPopupEffect, setTierPopupEffect] = useState('bounce');
  
  const [promoTitle, setPromoTitle] = useState('🔥 KHUYẾN MÃI TOÀN SÀN 🔥');
  const [promoSubtitle, setPromoSubtitle] = useState('Giảm tới {discount}% — Kho video chất lượng 4K');
  const [promoColorFrom, setPromoColorFrom] = useState('#f97316');
  const [promoColorTo, setPromoColorTo] = useState('#e11d48');
  const [promoTextColor, setPromoTextColor] = useState('#ffffff');
  const [promoCtaLabel, setPromoCtaLabel] = useState('Mua ngay ➔');
  const [promoCtaBg, setPromoCtaBg] = useState('#ffffff');
  const [promoCtaText, setPromoCtaText] = useState('#c026d3');

  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState({ type: '', text: '' });

  const [tiers, setTiers] = useState<{minItems: number, discountPercent: number}[]>([]);
  const [savingTiers, setSavingTiers] = useState(false);
  const [tiersMessage, setTiersMessage] = useState({ type: '', text: '' });

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
        
        if (data.tierPopupEnabled) setTierPopupEnabled(data.tierPopupEnabled);
        if (data.tierPopupTitle) setTierPopupTitle(data.tierPopupTitle);
        if (data.tierPopupDescription) setTierPopupDescription(data.tierPopupDescription);
        if (data.tierPopupColor) setTierPopupColor(data.tierPopupColor);
        if (data.tierPopupEffect) setTierPopupEffect(data.tierPopupEffect);
        
        if (data.promoTitle) setPromoTitle(data.promoTitle);
        if (data.promoSubtitle) setPromoSubtitle(data.promoSubtitle);
        if (data.promoColorFrom) setPromoColorFrom(data.promoColorFrom);
        if (data.promoColorTo) setPromoColorTo(data.promoColorTo);
        if (data.promoTextColor) setPromoTextColor(data.promoTextColor);
        if (data.promoCtaLabel) setPromoCtaLabel(data.promoCtaLabel);
        if (data.promoCtaBg) setPromoCtaBg(data.promoCtaBg);
        if (data.promoCtaText) setPromoCtaText(data.promoCtaText);

        const tiersRes = await fetch('/api/tiers');
        if (tiersRes.ok) {
          const tiersData = await tiersRes.json();
          setTiers(tiersData || []);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

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
            promoTitle,
            promoSubtitle,
            promoColorFrom,
            promoColorTo,
            promoTextColor,
            promoCtaLabel,
            promoCtaBg,
            promoCtaText,
            tierPopupEnabled,
            tierPopupTitle,
            tierPopupDescription,
            tierPopupColor,
            tierPopupEffect,
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

  const handleAddTier = () => {
    setTiers([...tiers, { minItems: 2, discountPercent: 10 }]);
  };

  const handleUpdateTier = (index: number, field: 'minItems' | 'discountPercent', value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = parseInt(value) || 0;
    setTiers(newTiers);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSaveTiers = async () => {
    setSavingTiers(true);
    setTiersMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers }),
      });
      
      const settingsRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            tierPopupEnabled,
            tierPopupTitle,
            tierPopupDescription,
            tierPopupColor,
            tierPopupEffect,
          }
        }),
      });

      if (res.ok && settingsRes.ok) {
        setTiersMessage({ type: 'success', text: 'Đã lưu cấu hình Ưu đãi & Popup thành công.' });
      } else {
        setTiersMessage({ type: 'error', text: 'Lỗi khi lưu cấu hình.' });
      }
    } catch (error) {
      setTiersMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingTiers(false);
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Khuyến Mãi</h1>
      
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

        {/* ─── Tùy chỉnh Giao diện Banner Top ─── */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nội dung & Màu sắc Banner Top (Hiển thị khi giảm giá &gt; 0)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề Banner</label>
              <input
                type="text"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả phụ (dùng {'{discount}'} để chèn % tự động)</label>
              <input
                type="text"
                value={promoSubtitle}
                onChange={(e) => setPromoSubtitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label Nút bấm (CTA)</label>
              <input
                type="text"
                value={promoCtaLabel}
                onChange={(e) => setPromoCtaLabel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Màu nền 1 (From)</label>
              <input type="color" value={promoColorFrom} onChange={(e) => setPromoColorFrom(e.target.value)} className="w-full h-10 rounded border-gray-300 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Màu nền 2 (To)</label>
              <input type="color" value={promoColorTo} onChange={(e) => setPromoColorTo(e.target.value)} className="w-full h-10 rounded border-gray-300 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Màu chữ Banner</label>
              <input type="color" value={promoTextColor} onChange={(e) => setPromoTextColor(e.target.value)} className="w-full h-10 rounded border-gray-300 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Màu nền Nút CTA</label>
              <input type="color" value={promoCtaBg} onChange={(e) => setPromoCtaBg(e.target.value)} className="w-full h-10 rounded border-gray-300 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Màu chữ Nút CTA</label>
              <input type="color" value={promoCtaText} onChange={(e) => setPromoCtaText(e.target.value)} className="w-full h-10 rounded border-gray-300 cursor-pointer" />
            </div>
          </div>
          
          <div className="p-4 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden relative">
             <div style={{ background: `linear-gradient(135deg, ${promoColorFrom}, ${promoColorTo})`, color: promoTextColor }} className="w-full py-2 px-4 rounded shadow-md flex items-center justify-between text-sm font-bold">
               <span>{promoTitle} <span className="opacity-90 font-medium ml-2">{promoSubtitle.replace('{discount}', globalDiscountPercent)}</span></span>
               <span style={{ background: promoCtaBg, color: promoCtaText }} className="px-3 py-1 rounded-full shadow-sm">{promoCtaLabel}</span>
             </div>
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

      {/* Tiers Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Chương trình Ưu đãi Mua nhiều (Tiers)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Kích thích khách hàng mua nhiều video hơn bằng cách giảm giá thêm khi đạt số lượng nhất định.
        </p>

        <div className="space-y-4 mb-6">
          {tiers.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Chưa có cài đặt ưu đãi mua nhiều nào.</p>
          ) : (
            tiers.map((tier, index) => (
              <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng tối thiểu (Min Items)</label>
                  <input
                    type="number"
                    min="1"
                    value={tier.minItems}
                    onChange={(e) => handleUpdateTier(index, 'minItems', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giảm thêm (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={tier.discountPercent}
                      onChange={(e) => handleUpdateTier(index, 'discountPercent', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveTier(index)}
                  className="mt-5 text-red-500 hover:text-red-700 p-2"
                  title="Xóa mức ưu đãi"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleAddTier}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 mb-6 border border-indigo-600 rounded-md px-3 py-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm mức ưu đãi mới
        </button>

        {/* Tier Popup Banner Settings */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Popup Quảng Cáo (Góc màn hình)
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Hiển thị một popup nhỏ gián tiếp giới thiệu về Ưu đãi Mua nhiều khi khách mới vào web. Khi thu nhỏ, popup sẽ nằm ở góc dưới bên trái màn hình.
          </p>

          <div className="mb-6 flex items-center">
            <input
              id="tierPopupEnabled"
              type="checkbox"
              checked={tierPopupEnabled === 'true'}
              onChange={(e) => setTierPopupEnabled(e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="tierPopupEnabled" className="ml-2 text-sm font-medium text-gray-900">
              Bật Popup quảng cáo Ưu đãi Mua nhiều
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề Popup</label>
              <input
                type="text"
                value={tierPopupTitle}
                onChange={(e) => setTierPopupTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung (dùng {'{maxTier}'} để chèn % tối đa)</label>
              <textarea
                value={tierPopupDescription}
                onChange={(e) => setTierPopupDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc chủ đạo</label>
              <select
                value={tierPopupColor}
                onChange={(e) => setTierPopupColor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value="cyan">Cyan (Lấp lánh xanh lam)</option>
                <option value="amber">Amber (Vàng nghệ)</option>
                <option value="green">Green (Xanh lục)</option>
                <option value="purple">Purple (Tím quyền lực)</option>
                <option value="rose">Rose (Hồng nhạt)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu ứng chuyển động (Animation)</label>
              <select
                value={tierPopupEffect}
                onChange={(e) => setTierPopupEffect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value="none">Không có (Tĩnh)</option>
                <option value="bounce">Nhảy lên xuống (Bounce)</option>
                <option value="pulse">Nhịp đập (Pulse)</option>
              </select>
            </div>
          </div>
        </div>

        {tiersMessage.text && (
          <div className={`p-3 rounded-md mb-6 text-sm font-medium ${tiersMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {tiersMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveTiers}
          disabled={savingTiers}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingTiers ? 'Đang lưu...' : 'Lưu toàn bộ cài đặt (Ưu đãi & Popup)'}
        </button>
      </div>
    </div>
  );
}
