import Link from 'next/link';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-3xl max-w-lg w-full shadow-2xl shadow-cyan-900/20 relative overflow-hidden">
        {/* Confetti / Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Thanh toán Thành công!</h1>
        <p className="text-slate-400 mb-8">
          Đơn hàng {orderId ? <span className="text-cyan-400 font-mono font-bold">#{orderId}</span> : 'của bạn'} đã được xác nhận.
        </p>

        <div className="bg-slate-950 rounded-2xl p-6 text-left border border-slate-800 space-y-4 mb-8">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-indigo-400 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Kiểm tra Email</h3>
              <p className="text-sm text-slate-400">Chúng tôi đã gửi link tải qua Email bạn vừa nhập.</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-cyan-400 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Kiểm tra Google Drive</h3>
              <p className="text-sm text-slate-400">Truy cập mục "Được chia sẻ với tôi" trên tài khoản Google Drive của bạn để xem file.</p>
            </div>
          </div>
        </div>

        <Link 
          href="/" 
          className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-medium px-8 py-4 rounded-xl transition-colors"
        >
          Quay lại Trang chủ
        </Link>
      </div>
    </div>
  );
}
