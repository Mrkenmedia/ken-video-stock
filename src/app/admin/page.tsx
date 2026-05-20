import { getProducts, sheets, SPREADSHEET_ID } from '@/lib/google';
import { promises as fs } from 'fs';
import path from 'path';

export const revalidate = 0;

// ─── Promotion Analytics ──────────────────────────────────────────────────────
interface PromoAnalytics {
  totalImpressions: number;
  uniqueSessions: number;
  lastUpdated: string;
  dailyStats: Record<string, number>;
}

async function fetchPromoStats(): Promise<PromoAnalytics> {
  try {
    const file = path.join(process.cwd(), '.next', 'promotion-analytics.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { totalImpressions: 0, uniqueSessions: 0, lastUpdated: '', dailyStats: {} };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [products, promoStats] = await Promise.all([
    getProducts(),
    fetchPromoStats(),
  ]);
  const activeProductsCount = products.filter(p => p.status === 'active').length;
  
  let orders: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A2:H',
    });
    orders = (res.data.values as string[][]) || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
  }

  const todayStr = new Date()
    .toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  
  const todaysOrders = orders.filter(order => {
    if (!order[1]) return false;
    return order[1].startsWith(todayStr);
  });
  
  const todayRevenue = todaysOrders.reduce((sum, order) => {
     if (order[6] === 'completed') {
        return sum + (parseFloat(order[5]) || 0);
     }
     return sum;
  }, 0);

  const pendingOrdersCount = orders.filter(order => order[6] === 'pending').length;
  const promoToday = promoStats.dailyStats?.[todayStr] ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan (Dashboard)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Doanh thu hôm nay</h3>
          <p className="text-3xl font-bold text-teal-600 mt-2">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(todayRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Đơn hàng mới (Chờ TT)</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{pendingOrdersCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Số lượng File kho</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{activeProductsCount}</p>
        </div>
      </div>

      {/* ─── Promotion Analytics ─────────────────────────────────────── */}
      <h2 className="text-xl font-bold text-gray-700 mt-10 mb-4">📊 Banner Khuyến Mãi — Thống kê lượt xem</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-lg shadow border border-orange-100">
          <h3 className="text-gray-500 text-sm font-medium">Tổng lượt xem banner</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {promoStats.totalImpressions.toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-lg shadow border border-orange-100">
          <h3 className="text-gray-500 text-sm font-medium">Lượt xem hôm nay</h3>
          <p className="text-3xl font-bold text-pink-600 mt-2">
            {promoToday.toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-lg shadow border border-orange-100">
          <h3 className="text-gray-500 text-sm font-medium">Phiên độc lập (Unique)</h3>
          <p className="text-3xl font-bold text-rose-600 mt-2">
            {promoStats.uniqueSessions.toLocaleString('vi-VN')}
          </p>
          {promoStats.lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">
              Cập nhật: {new Date(promoStats.lastUpdated).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
