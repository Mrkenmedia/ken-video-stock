"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

import { useCart } from '@/contexts/CartContext';

function CheckoutContent() {
  const router = useRouter();
  const { items, effectiveTotal, cartTotal, baseTotal, cartCount, tierDiscountPercent, finalTotal: cartFinalTotal, isFlashSaleActive } = useCart();

  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Auto-fill email from session
  useEffect(() => {
    if (session?.user?.email && !email) {
      setEmail(session.user.email);
    }
  }, [session, email]);
  const [step, setStep] = useState<Step>('info');

  const [orderId, setOrderId] = useState('');
  const [finalPrice, setFinalPrice] = useState(0);
  const [transferContent, setTransferContent] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // Fetch settings for payment instructions
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.paymentInstructions) {
          setPaymentInstructions(data.paymentInstructions);
        }
      })
      .catch(e => console.error('Failed to load settings:', e));
  }, []);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [appliedCouponType, setAppliedCouponType] = useState<'global' | 'exclusive' | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && step === 'info') {
      router.push('/cart');
    }
  }, [items, step, router]);

  // Polling order status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (step === 'qr' && orderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}?t=${Date.now()}`, { cache: 'no-store' });
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
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, orderId, router]);

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
        body: JSON.stringify({ code: couponInput, cartTotal: cartTotal, cartFinalTotal: cartFinalTotal })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data.couponCode);
        setDiscountAmount(data.discountAmount);
        setAppliedCouponType(data.couponType);
        setCouponError('');
      } else {
        setCouponError(data.error || 'Mã không hợp lệ.');
        setAppliedCoupon('');
        setDiscountAmount(0);
        setAppliedCouponType(null);
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
    setAppliedCouponType(null);
    setCouponInput('');
  };

  const handleCreateOrder = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Vui lòng nhập email hợp lệ có dùng Google Drive.');
      return;
    }
    setEmailError('');
    setCreatingOrder(true);

    const flashSaleStart = localStorage.getItem('ken_flash_sale_start') || undefined;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: items.map(i => ({ sku: i.sku, format: i.format })), 
          email, 
          couponCode: appliedCoupon,
          flashSaleStart
        }),
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

  const qrUrl = orderId
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${finalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : '';

  if (items.length === 0 && step === 'info') {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="animate-pulse text-slate-400 text-lg">Đang chuyển hướng về giỏ hàng...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/cart" className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại giỏ hàng
        </Link>
        <h1 className="text-3xl font-bold text-white">Thanh toán An toàn</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* LEFT */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Cart summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Danh sách sản phẩm ({items.length})</h2>
              <Link href="/cart" className="text-xs text-cyan-400 hover:underline">Sửa giỏ hàng</Link>
            </div>
            <div className="divide-y divide-slate-800">
              {items.map((item) => {
                const itemOriginalPrice = item.originalPrice || item.price;
                return (
                <div key={`${item.sku}-${item.format}`} className="p-4 flex gap-4 items-center">
                  {item.thumbnailUrl && (
                    <div className="w-16 h-10 rounded bg-slate-800 overflow-hidden shrink-0">
                      <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">{item.sku} • {item.format}</p>
                  </div>
                  <div className="text-right">
                    {itemOriginalPrice > item.price && (
                      <p className="text-[10px] text-slate-500 line-through mb-0.5">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemOriginalPrice)}
                      </p>
                    )}
                    <p className="text-sm font-bold text-slate-300">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </p>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              Mã giảm giá
              {tierDiscountPercent > 0 && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded">Đã áp dụng ưu đãi mua nhiều</span>}
              {isFlashSaleActive && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">Ưu đãi Flash Sale tối đa</span>}
            </h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-green-400 font-bold uppercase">{appliedCoupon} {appliedCouponType === 'exclusive' ? '(Độc quyền)' : ''}</p>
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
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition uppercase disabled:opacity-30"
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
            <h2 className="text-lg font-semibold text-white mb-1">Email nhận file (Google Drive)</h2>
            <p className="text-xs text-slate-500 mb-4">Quyền truy cập thư mục sẽ được cấp tự động vào email này.</p>
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
          {step === 'info' && (() => {
            const isExclusive = appliedCouponType === 'exclusive';
            const displaySubtotal = isExclusive ? cartTotal : effectiveTotal;
            const finalPriceToPay = isExclusive 
              ? Math.max(0, cartTotal - discountAmount) 
              : Math.max(0, cartFinalTotal - discountAmount);

            return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tổng giá sản phẩm gốc:</span>
                  <span className="text-white font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal)}</span>
                </div>
                
                {/* Global Discount */}
                {baseTotal > cartTotal && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-blue-50/10 p-3 rounded-lg text-blue-400 font-medium border border-blue-500/20">
                    <div className="flex flex-wrap items-center gap-1.5">
                       <span>🎉 Khuyến mãi toàn sàn</span>
                       <span className="text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full shrink-0">
                          -{Math.round(((baseTotal - cartTotal) / baseTotal) * 100)}%
                       </span>
                    </div>
                    <span className="text-blue-400 font-bold self-end sm:self-auto shrink-0">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal - cartTotal)}
                    </span>
                  </div>
                )}
                
                {/* Flash Sale Discount */}
                {!isExclusive && cartTotal > effectiveTotal && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-amber-50/10 p-3 rounded-lg text-amber-400 font-medium border border-amber-500/20">
                    <div className="flex flex-wrap items-center gap-1.5">
                       <span>⚡ Trợ giá / Flash Sale</span>
                       <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                          -{Math.round(((cartTotal - effectiveTotal) / cartTotal) * 100)}%
                       </span>
                    </div>
                    <span className="text-amber-400 font-bold self-end sm:self-auto shrink-0">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal - effectiveTotal)}
                    </span>
                  </div>
                )}

                {/* Tier Discount */}
                {!isExclusive && tierDiscountPercent > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-green-50/10 p-3 rounded-lg text-green-400 font-medium border border-green-500/20">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>📦 Ưu đãi mua nhiều</span>
                      <span className="text-[11px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full shrink-0">
                        -{tierDiscountPercent}%
                      </span>
                    </div>
                    <span className="text-green-400 font-bold self-end sm:self-auto shrink-0">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(effectiveTotal - cartFinalTotal)}
                    </span>
                  </div>
                )}

                {/* Coupon Discount */}
                {appliedCoupon && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-cyan-50/10 p-3 rounded-lg text-cyan-400 font-medium border border-cyan-500/20">
                    <span>🎫 Mã giảm giá ({appliedCoupon}) {isExclusive ? '(Độc quyền)' : ''}</span>
                    <span className="text-cyan-400 font-bold self-end sm:self-auto shrink-0">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                    </span>
                  </div>
                )}

                {/* Total savings */}
                {baseTotal > finalPriceToPay && (
                  <div className="flex justify-between text-sm text-red-400 font-bold border-t border-slate-800 border-dashed pt-3 mt-2">
                    <span>✨ Tổng tiền bạn tiết kiệm được:</span>
                    <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal - finalPriceToPay)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6 border-t border-slate-800 pt-4">
                <span className="text-slate-400 text-lg">Cần thanh toán</span>
                <div className="text-right">
                   {baseTotal > finalPriceToPay && (
                     <div className="text-sm text-slate-500 line-through mb-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseTotal)}</div>
                   )}
                   <span className="text-3xl font-extrabold text-cyan-400">
                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPriceToPay)}
                   </span>
                </div>
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
            );
          })()}

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

                {paymentInstructions && (
                  <div 
                    className="mt-6 text-left text-xs text-slate-300 border-t border-slate-800 pt-4 prose prose-invert max-w-none overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: paymentInstructions }}
                  />
                )}

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
