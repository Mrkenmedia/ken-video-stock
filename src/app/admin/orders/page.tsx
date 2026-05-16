import { sheets, SPREADSHEET_ID } from '@/lib/google';
import OrdersTable from './OrdersTable';

export const revalidate = 0;

export default async function AdminOrdersPage() {
  let rawRows: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A2:H',
    });
    rawRows = (res.data.values as string[][]) || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
  }

  const orders = rawRows.map((row) => ({
    orderId: row[0] || '',
    date: row[1] || '',
    email: row[2] || '',
    sku: row[3] || '',
    format: row[4] || '',
    totalPrice: row[5] || '0',
    status: row[6] || 'pending',
    logs: row[7] || '',
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng cộng: <span className="font-semibold">{orders.length}</span> đơn hàng
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Thành công: {orders.filter((o) => o.status === 'completed').length}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg font-medium">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Chờ TT: {orders.filter((o) => o.status === 'pending').length}
          </span>
        </div>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
