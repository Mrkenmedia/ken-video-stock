import { getProducts, sheets, SPREADSHEET_ID } from '@/lib/google';

export const revalidate = 0;

export default async function AdminDashboard() {
  const products = await getProducts();
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

  const todayStr = new Date().toISOString().split('T')[0]; // Lấy ngày YYYY-MM-DD
  
  const todaysOrders = orders.filter(order => {
    if (!order[1]) return false;
    // Format ngày là ISO string nên lấy phần đầu
    return order[1].startsWith(todayStr);
  });
  
  const todayRevenue = todaysOrders.reduce((sum, order) => {
     if (order[6] === 'completed') {
        return sum + (parseFloat(order[5]) || 0);
     }
     return sum;
  }, 0);

  const pendingOrdersCount = orders.filter(order => order[6] === 'pending').length;

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
    </div>
  );
}
