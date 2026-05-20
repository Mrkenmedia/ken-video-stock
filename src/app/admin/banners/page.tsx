'use client';

import { useState, useEffect } from 'react';
import { Banner } from '@/types';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [order, setOrder] = useState('0');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [opacity, setOpacity] = useState('60');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      // Add cache buster and no-store to prevent browser from caching old data
      const res = await fetch(`/api/banners?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      } else {
        setError('Không thể tải danh sách banner');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setMediaType('image');
    setMediaUrl('');
    setLinkUrl('');
    setOrder((banners.length * 10).toString());
    setStatus('active');
    setOpacity('60');
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setMediaType(banner.mediaType);
    setMediaUrl(banner.mediaUrl);
    setLinkUrl(banner.linkUrl || '');
    setOrder(banner.order.toString());
    setStatus(banner.status || 'active');
    setOpacity(banner.opacity !== undefined ? banner.opacity.toString() : '60');
    setIsModalOpen(true);
  };

  const toggleStatus = async (banner: Banner) => {
    const newStatus = banner.status === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banner.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        fetchBanners();
      } else {
        alert('Không thể thay đổi trạng thái banner');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      alert('Vui lòng nhập Link hoặc ID tài nguyên Media');
      return;
    }
    
    const bannerData = {
      title,
      subtitle,
      mediaType,
      mediaUrl,
      linkUrl,
      order: parseInt(order) || 0,
      status,
      opacity: parseInt(opacity) || 60,
    };

    try {
      const method = editingBanner ? 'PUT' : 'POST';
      const body = editingBanner ? { id: editingBanner.id, ...bannerData } : bannerData;
      
      const res = await fetch('/api/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchBanners();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Có lỗi xảy ra khi lưu Banner');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Banner này?')) return;
    try {
      const res = await fetch(`/api/banners?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBanners();
      } else {
        alert('Không thể xóa banner');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const getMediaSrc = (url: string) => {
    if (!url) return '';
    // If it looks like a Google Drive file ID (alphanumeric, 25+ chars, no slashes or dots)
    const isDriveId = /^[a-zA-Z0-9_-]{25,}$/.test(url);
    if (isDriveId) {
      return `/api/drive-proxy?id=${url}`;
    }
    return url;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Quản lý Banners</h1>
          <p className="text-slate-500 mt-1">Quản lý hình ảnh và video trình chiếu (Carousel) tại trang chủ cửa hàng.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition shadow-lg shadow-teal-600/25 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Thêm Banner Mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center gap-2 text-teal-600 font-bold">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Đang tải dữ liệu Banner...
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-slate-500 font-medium">Chưa có banner nào được thiết lập.</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 transition rounded-xl font-bold text-sm border border-teal-200"
          >
            Thêm Banner đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner, index) => (
            <div key={`${banner.id}-${index}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
              {/* Media Preview Area */}
              <div className="relative aspect-[21/9] bg-slate-900 overflow-hidden flex items-center justify-center">
                {banner.mediaType === 'video' ? (
                  <video
                    src={getMediaSrc(banner.mediaUrl)}
                    className="w-full h-full object-cover"
                    muted
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={getMediaSrc(banner.mediaUrl)}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Badges Container */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide shadow-md ${banner.mediaType === 'video' ? 'bg-cyan-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {banner.mediaType === 'video' ? 'Video' : 'Ảnh'}
                  </span>
                  
                  <button
                    onClick={() => toggleStatus(banner)}
                    title="Click để thay đổi trạng thái hiển thị"
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide shadow-md transition-all flex items-center gap-1.5 ${banner.status === 'inactive' ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${banner.status === 'inactive' ? 'bg-slate-300' : 'bg-emerald-200 animate-pulse'}`}></span>
                    {banner.status === 'inactive' ? 'Đang Ẩn' : 'Hiển Thị'}
                  </button>
                </div>
                
                {/* Order Badge */}
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white px-2 py-1 text-xs font-bold rounded-md border border-slate-700 z-10">
                  Thứ tự: {banner.order}
                </span>
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{banner.title || <span className="text-slate-400 italic">Không có tiêu đề</span>}</h3>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-1">{banner.subtitle || <span className="text-slate-300 italic">Không có tiêu đề phụ</span>}</p>
                  
                  <div className="mt-3 space-y-1 text-xs font-mono text-slate-400">
                    <p className="truncate">Media URL/ID: {banner.mediaUrl}</p>
                    {banner.linkUrl && <p className="truncate">Link điều hướng: {banner.linkUrl}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4 justify-end">
                  <button
                    onClick={() => openEditModal(banner)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBanner ? 'Cập nhật Banner' : 'Thêm Banner Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại Media</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${mediaType === 'image' ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/25' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Hình Ảnh (Image)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${mediaType === 'video' ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/25' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Video Clip
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Đường dẫn Media (Link hoặc Google Drive ID) *
                </label>
                <input
                  type="text"
                  placeholder={mediaType === 'video' ? 'Nhập ID file Drive Demo hoặc Link video' : 'Nhập Link ảnh hoặc ID file ảnh từ Drive'}
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 font-medium"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Bạn có thể dán link ảnh/video trực tiếp hoặc **nhập mã ID của Google Drive** (Ví dụ: `1u_Sxp54X4...`), hệ thống sẽ tự động tối ưu hóa phát/hiển thị!
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề chính (Title)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Độc Quyền Footage 4K"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề phụ (Subtitle)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảm giá cực sâu chỉ trong hôm nay"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Link khi click</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: /category"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 10"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Độ tối nền: {opacity}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(e.target.value)}
                    className="w-full mt-3 accent-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái hiển thị</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${status === 'active' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/25' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Hiển Thị (Active)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inactive')}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${status === 'inactive' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Ẩn Banner (Inactive)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/25"
                >
                  {editingBanner ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
