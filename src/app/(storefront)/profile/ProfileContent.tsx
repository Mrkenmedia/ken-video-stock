"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface OrderItem {
  sku: string;
  format: string;
  name: string;
  thumbnailUrl: string;
  link: string | null;
}

interface Order {
  orderId: string;
  date: string;
  email: string;
  totalPrice: number;
  status: string;
  items: OrderItem[];
}

interface ProfileContentProps {
  user: {
    name: string;
    email: string;
    image: string;
  };
  orders: Order[];
}

export default function ProfileContent({ user, orders }: ProfileContentProps) {
  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trang Cá Nhân</h1>
          <p className="text-slate-400">Xem lịch sử mua hàng và truy cập file gốc.</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition font-medium border border-slate-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* User Info Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-800" />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {user.name.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="text-lg font-bold text-white truncate" title={user.name}>{user.name || "Khách hàng"}</h2>
            <p className="text-sm text-slate-400 truncate mt-1" title={user.email}>{user.email}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-800 text-left space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase">Tổng đơn hàng</p>
                <p className="text-xl font-bold text-cyan-400">{orders.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">File đã mua</p>
                <p className="text-xl font-bold text-white">
                  {orders.reduce((acc, o) => o.status === 'completed' ? acc + o.items.length : acc, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="md:col-span-3 space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4 mb-6">Lịch sử Đơn Hàng</h2>
          
          {orders.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-slate-400 mb-6">Bạn chưa mua video nào bằng email này.</p>
              <Link href="/" className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-6 py-3 rounded-xl transition">
                Khám phá Video
              </Link>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.orderId} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition hover:border-slate-700">
                <div className="bg-slate-800/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-cyan-400 font-bold">{order.orderId}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.status === 'completed' ? 'Thành công' : 'Đang xử lý'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Ngày mua: {new Date(order.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase">Tổng tiền</p>
                    <p className="text-lg font-bold text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice)}
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={`${item.sku}-${idx}`} className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.name} className="w-20 h-14 object-cover rounded bg-slate-800" />
                        ) : (
                          <div className="w-20 h-14 bg-slate-800 rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white line-clamp-1" title={item.name}>{item.name}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{item.sku}</span>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{item.format}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {order.status === 'completed' ? (
                            item.link ? (
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-cyan-900/20"
                              >
                                Tải File Gốc
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </a>
                            ) : (
                              <span className="text-xs text-yellow-500 italic">Đang cập nhật link...</span>
                            )
                          ) : (
                            <span className="text-xs text-slate-500">Chờ thanh toán</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
