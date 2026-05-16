"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProductInfo {
  sku: string;
  name: string;
  thumbnailUrl: string;
  priceMp4: number;
  priceMov: number;
}

type Step = 'info' | 'qr' | 'done';

const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
const ACCOUNT_NO = process.env.NEXT_PUBLIC_ACCOUNT_NO || '0123456789';
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_ACCOUNT_NAME || 'NGUYEN VAN KEN';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sku = searchParams.get('sku') || '';
  const formatParam = (searchParams.get('format') || 'MP4').toUpperCase() as 'MP4' | 'MOV';

  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState('');

  const [format, setFormat] = useState<'MP4' | 'MOV'>(formatParam);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [step, setStep] = useState<Step>('info');

  const [orderId, setOrderId] = useState('');
  const [finalPrice, setFinalPrice] = useState(0);
  const [transferContent, setTransferContent] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Fetch real product data
  useEffect(() => {
    if (!sku) { setProductError('Không tìm thấy SKU sản phẩm.'); setLoadingProduct(false); return; }
    setLoadingProduct(true);
    fetch(`/api/products/${encodeURIComponent(sku)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setProductError(data.error); } else { setProduct(data); }
      })
      .catch(() => setProductError('Không thể tải thông tin sản phẩm.'))
      .finally(() => setLoadingProduct(false));
  }, [sku]);

  // Polling order status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (step === 'qr' && orderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              clearInterval(intervalId);
              router.push(`/payment-success?orderId=${orderId}`);
            }
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, orderId, router]);

  const currentPrice = product ? (format === 'MOV' ? product.priceMov : product.priceMp4) : 0;

  const qrUrl = orderId
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${finalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : '';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transferContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {}
  }, [transferContent]);

  const handleApplyCoupon = async () => {
    if (!couponInput) {
      setCouponError('Vui lòng nhập mã giảm giá.');
      return;
    }
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, cartTotal: currentPrice })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data.couponCode);
        setDiscountAmount(data.discountAmount);
        setCouponError('');
      } else {
        setCouponError(data.error || 'Mã không hợp lệ.');
        setAppliedCoupon('');
        setDiscountAmount(0);
      }
    } catch (e) {
      setCouponError('Lỗi kết nối khi áp dụng mã.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    setDiscountAmount(0);
    setCouponInput('');
  };

  const handleCreateOrder = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Vui lòng nhập email hợp lệ có dùng Google Drive.');
      return;
    }
    setEmailError('');
    setCreatingOrder(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, format, email, couponCode: appliedCoupon }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Có lỗi khi tạo đơn hàng.'); return; }
      setOrderId(data.orderId);
      setFinalPrice(data.price);
      setTransferContent(data.transferContent);
      setStep('qr');
    } catch {
      alert('Lỗi kết nối server, vui lòng thử lại.');
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="animate-pulse text-slate-400 text-lg">Đang tải thông tin sản phẩm...</div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <p className="text-red-400 text-xl mb-4">{productError || 'Sản phẩm không tồn tại.'}</p>
        <Link href="/" className="text-cyan-400 hover:underline">← Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Link href={`/${sku}`} className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại sản phẩm
        </Link>
        <h1 className="text-3xl font-bold text-white">Thanh toán An toàn</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* LEFT */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Product summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-center">
            {product.thumbnailUrl && (
              <div className="w-24 h-14 rounded-lg overflow-hidden shrink-0">
                <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Sản phẩm</p>
              <p className="text-white font-semibold">{product.name}</p>
              <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
            </div>
          </div>

          {/* Format selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">1. Chọn định dạng</h2>
            <div className="grid grid-cols-2 gap-3">
              {product.priceMp4 > 0 && (
                <button
                  onClick={() => setFormat('MP4')}
                  disabled={step === 'qr'}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${format === 'MP4' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <p className="font-bold text-white">MP4</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tối ưu Web & MXH</p>
                  <p className="text-cyan-400 font-bold mt-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMp4)}</p>
                </button>
              )}
              {product.priceMov > 0 && (
                <button
                  onClick={() => setFormat('MOV')}
                  disabled={step === 'qr'}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${format === 'MOV' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <p className="font-bold text-white">MOV</p>
                  <p className="text-xs text-slate-400 mt-0.5">File gốc ProRes/Alpha</p>
                  <p className="text-cyan-400 font-bold mt-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceMov)}</p>
                </button>
              )}
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">2. Mã giảm giá (Nếu có)</h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-green-400 font-bold uppercase">{appliedCoupon}</p>
                  <p className="text-xs text-green-500 mt-1">Đã giảm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</p>
                </div>
                <button onClick={removeCoupon} disabled={step === 'qr'} className="text-slate-400 hover:text-white p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nhập mã tại đây..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition uppercase disabled:opacity-50"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  disabled={step === 'qr'}
                />
                <button 
                  onClick={handleApplyCoupon}
                  disabled={!couponInput || applyingCoupon || step === 'qr'}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {applyingCoupon ? 'Đang thử...' : 'Áp dụng'}
                </button>
              </div>
            )}
            {couponError && <p className="text-red-400 text-sm mt-2">{couponError}</p>}
          </div>

          {/* Email */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">3. Email nhận file (Google Drive)</h2>
            <p className="text-xs text-slate-500 mb-4">File sẽ được chia sẻ tự động vào email này sau khi thanh toán xong.</p>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              disabled={step === 'qr'}
            />
            {emailError && <p className="text-red-400 text-sm mt-2">{emailError}</p>}
          </div>

          {/* Order total + CTA */}
          {step === 'info' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              {appliedCoupon && (
                <div className="border-b border-slate-800 pb-4 mb-4 space-y-2">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Tạm tính</span>
                      <span className="text-white line-through opacity-70">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Giảm giá ({appliedCoupon})</span>
                      <span className="text-green-400 font-medium">
                        -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                      </span>
                   </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-5">
                <span className="text-slate-400">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice - discountAmount)}
                </span>
              </div>
              <button
                onClick={handleCreateOrder}
                disabled={creatingOrder}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingOrder ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Đang tạo đơn hàng...
                  </>
                ) : 'Tạo đơn & Lấy mã QR'}
              </button>
            </div>
          )}

          {step === 'qr' && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-5 text-center">
              <p className="text-green-400 font-semibold text-lg">✅ Đơn hàng #{orderId} đã được tạo!</p>
              <p className="text-slate-400 text-sm mt-1">Quét mã QR bên cạnh để hoàn tất thanh toán. Hệ thống tự động cấp file sau khi nhận tiền.</p>
            </div>
          )}
        </div>

        {/* RIGHT — QR Panel */}
        <div className="md:col-span-2">
          <div className="sticky top-28 bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 text-center shadow-2xl shadow-cyan-900/10">
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full mb-6" />
            <h2 className="text-lg font-bold text-white mb-1">3. Quét mã VietQR</h2>
            <p className="text-xs text-slate-500 mb-5">Mở app ngân hàng bất kỳ để quét. Xử lý tự động 100%.</p>

            {step === 'info' ? (
              <div className="bg-slate-800 rounded-2xl p-8 flex items-center justify-center min-h-[260px]">
                <div className="text-center text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  <p className="text-sm">Điền thông tin bên trái<br/>để hiện mã QR thanh toán</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-3 rounded-2xl inline-block mb-5 shadow-lg">
                  <img src={qrUrl} alt="VietQR" className="w-52 h-52 object-contain" />
                </div>

                <div className="bg-slate-950 rounded-xl p-4 text-left border border-slate-800 space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Số tiền</p>
                    <p className="text-xl font-bold text-cyan-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Nội dung chuyển khoản (bắt buộc)</p>
                    <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 gap-2">
                      <p className="font-mono text-cyan-400 font-bold text-sm break-all">{transferContent}</p>
                      <button
                        onClick={handleCopy}
                        title="Sao chép"
                        className={`shrink-0 transition-colors ${copySuccess ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}
                      >
                        {copySuccess ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                  Đang chờ xác nhận thanh toán...
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-white">Đang tải...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
