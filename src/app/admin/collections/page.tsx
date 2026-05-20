'use client';

import { useState, useEffect, useRef } from 'react';

type Collection = { id: string; title: string; skus: string };
type Product = { sku: string; name: string };

// Sub-component for individual collection editor
function CollectionItemEditor({ 
  col, 
  index,
  total,
  updateCollection, 
  removeCollection,
  moveCollection,
  allProducts 
}: { 
  col: Collection;
  index: number;
  total: number;
  updateCollection: (id: string, field: 'title'|'skus', value: string) => void;
  removeCollection: (id: string) => void;
  moveCollection: (id: string, direction: 'up' | 'down') => void;
  allProducts: Product[];
}) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedSkus = (col.skus || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  
  const availableProducts = allProducts.filter(p => 
    !selectedSkus.includes(p.sku) && 
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 15);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSku = (sku: string) => {
    const newSkus = [...selectedSkus, sku].join(', ');
    updateCollection(col.id, 'skus', newSkus);
    setSearch('');
    setShowDropdown(false);
  };

  const removeSku = (sku: string) => {
    const newSkus = selectedSkus.filter((s: string) => s !== sku).join(', ');
    updateCollection(col.id, 'skus', newSkus);
  };

  return (
    <div className="flex gap-3 items-start">
      {/* Order Controls */}
      <div className="flex flex-col gap-1 pt-1 flex-shrink-0">
        {/* Position badge */}
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center border border-purple-200">
          {index + 1}
        </div>
        <button
          onClick={() => moveCollection(col.id, 'up')}
          disabled={index === 0}
          title="Di chuyển lên"
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => moveCollection(col.id, 'down')}
          disabled={index === total - 1}
          title="Di chuyển xuống"
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Collection Card */}
      <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
        <button 
          onClick={() => removeCollection(col.id)}
          className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition"
          title="Xóa bộ sưu tập này"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mr-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên bộ sưu tập</label>
            <input
              type="text"
              value={col.title}
              onChange={e => updateCollection(col.id, 'title', e.target.value)}
              placeholder="VD: Trending Hôm Nay"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm bg-white text-gray-900"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sản phẩm trong bộ sưu tập 
              <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                {selectedSkus.length} sản phẩm
              </span>
            </label>
            
            {/* Product chips */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
              {selectedSkus.map((sku: string) => {
                const prod = allProducts.find(p => p.sku === sku);
                return (
                  <span key={sku} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded border border-purple-200">
                    <span className="max-w-[140px] truncate" title={prod ? prod.name : sku}>
                      {prod ? prod.name : sku}
                    </span> 
                    <span className="opacity-50 text-[10px]">({sku})</span>
                    <button onClick={() => removeSku(sku)} className="text-purple-600 hover:text-red-600 ml-1 font-bold leading-none">×</button>
                  </span>
                );
              })}
              {selectedSkus.length === 0 && (
                <span className="text-xs text-gray-400 italic pt-1">Chưa có sản phẩm nào</span>
              )}
            </div>

            {/* Search dropdown */}
            <div className="relative" ref={wrapperRef}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Tìm sản phẩm để thêm (tên hoặc SKU)..."
                  value={search}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm bg-white text-gray-900 shadow-sm"
                />
              </div>
              {showDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-52 overflow-y-auto">
                  {availableProducts.length > 0 ? (
                    availableProducts.map(p => (
                      <div 
                        key={p.sku} 
                        className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-100 flex justify-between items-center gap-2"
                        onMouseDown={() => addSku(p.sku)}
                      >
                        <span className="font-medium text-gray-800 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">{p.sku}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">
                      {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Gõ tên hoặc SKU để tìm kiếm'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Manual SKU fallback */}
            <div className="mt-3">
              <details className="group">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-purple-600 transition list-none flex items-center gap-1">
                  <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  Chỉnh sửa SKU thủ công
                </summary>
                <input
                  type="text"
                  value={col.skus}
                  onChange={e => updateCollection(col.id, 'skus', e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 border border-gray-200 rounded focus:ring-purple-500 text-xs font-mono text-gray-600 bg-white"
                  placeholder="SKU001, SKU005, SKU010"
                />
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [savingCollections, setSavingCollections] = useState(false);
  const [collectionsMessage, setCollectionsMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [resSettings, resProducts] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/products')
        ]);
        const dataSettings = await resSettings.json();
        const dataProducts = await resProducts.json();
        
        if (dataSettings.homepageCollections) {
          try { 
            const parsed = JSON.parse(dataSettings.homepageCollections);
            // Deduplicate IDs in case of corrupt data
            const seenIds = new Set<string>();
            const fixed = parsed.map((c: Collection) => {
              if (!c.id || seenIds.has(c.id)) {
                return { ...c, id: crypto.randomUUID() };
              }
              seenIds.add(c.id);
              return c;
            });
            setCollections(fixed);
          } 
          catch (e) { console.error('Failed to parse collections'); }
        }
        if (Array.isArray(dataProducts)) setAllProducts(dataProducts);
      } catch (error) {
        console.error('Failed to load:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveCollections = async () => {
    setSavingCollections(true);
    setCollectionsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'homepageCollections', value: JSON.stringify(collections) }),
      });
      setCollectionsMessage(res.ok 
        ? { type: 'success', text: '✅ Đã lưu thứ tự & danh sách Bộ sưu tập thành công.' }
        : { type: 'error', text: 'Lỗi khi lưu cấu hình.' }
      );
    } catch {
      setCollectionsMessage({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSavingCollections(false);
    }
  };

  const addCollection = () => {
    setCollections([...collections, { id: crypto.randomUUID(), title: '', skus: '' }]);
    setCollectionsMessage({ type: '', text: '' });
  };

  const updateCollection = (id: string, field: 'title'|'skus', value: string) => {
    setCollections(collections.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCollection = (id: string) => {
    setCollections(collections.filter(c => c.id !== id));
  };

  // Move collection up or down in the array
  const moveCollection = (id: string, direction: 'up' | 'down') => {
    const idx = collections.findIndex(c => c.id === id);
    if (idx === -1) return;
    const newList = [...collections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    // Swap
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    setCollections(newList);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Bộ Sưu Tập</h1>
          <p className="text-sm text-gray-500 mt-1">Thứ tự từ trên xuống = thứ tự hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={handleSaveCollections}
          disabled={savingCollections}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingCollections ? (
            <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Đang lưu...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Lưu thứ tự & danh sách</>
          )}
        </button>
      </div>

      {collectionsMessage.text && (
        <div className={`p-4 rounded-md mb-6 text-sm font-medium ${collectionsMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {collectionsMessage.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
        {/* Visual order guide */}
        {collections.length > 1 && (
          <div className="flex items-center gap-2 mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Dùng nút <strong className="mx-1">▲ ▼</strong> ở bên trái để thay đổi thứ tự. Số thứ tự = vị trí xuất hiện trên trang chủ. Nhấn <strong className="mx-1">Lưu</strong> để áp dụng.
          </div>
        )}

        {/* Collection list */}
        <div className="space-y-5 mb-6">
          {collections.map((col, idx) => (
            <CollectionItemEditor 
              key={col.id}
              col={col}
              index={idx}
              total={collections.length}
              allProducts={allProducts}
              updateCollection={updateCollection}
              removeCollection={removeCollection}
              moveCollection={moveCollection}
            />
          ))}
          {collections.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Chưa có bộ sưu tập nào. Hãy tạo mới bên dưới.
            </div>
          )}
        </div>

        <button
          onClick={addCollection}
          className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1.5 border border-purple-200 hover:border-purple-400 hover:bg-purple-50 px-4 py-2 rounded-md transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm bộ sưu tập mới
        </button>
      </div>
    </div>
  );
}
