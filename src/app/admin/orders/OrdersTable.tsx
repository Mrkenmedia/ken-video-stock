'use client';

import { useState } from 'react';
import RegrantModal from '@/components/admin/RegrantModal';

interface OrderRow {
  orderId: string;
  date: string;
  email: string;
  sku: string;
  format: string;
  totalPrice: string;
  status: string;
  logs: string;
}

interface OrdersTableProps {
  orders: OrderRow[];
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Thành công', cls: 'bg-green-100 text-green-800' },
  pending: { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-800' },
  failed: { label: 'Lỗi', cls: 'bg-red-100 text-red-800' },
};

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [modalOrder, setModalOrder] = useState<OrderRow | null>(null);

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã Đơn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày mua
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Khách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm (SKU)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => {
                const statusInfo = STATUS_MAP[order.status] ?? {
                  label: order.status,
                  cls: 'bg-gray-100 text-gray-600',
                };
                const priceVnd = parseFloat(order.totalPrice) || 0;
                const dateStr = order.date
                  ? new Date(order.date).toLocaleDateString('vi-VN')
                  : '—';

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dateStr}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] break-all">
                      {order.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="font-medium">{order.sku}</span>
                      {order.format && (
                        <span className="ml-1 text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                          {order.format}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {priceVnd > 0
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(priceVnd)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.cls}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setModalOrder(order)}
                        className="text-teal-600 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        title={`Cấp lại file cho đơn ${order.orderId}`}
                      >
                        🔄 Cấp lại File
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOrder && (
        <RegrantModal
          orderId={modalOrder.orderId}
          originalEmail={modalOrder.email}
          sku={modalOrder.sku}
          format={modalOrder.format}
          onClose={() => setModalOrder(null)}
        />
      )}
    </>
  );
}
