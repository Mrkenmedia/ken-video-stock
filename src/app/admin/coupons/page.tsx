import { getCoupons } from '@/lib/google';

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mã giảm giá (Coupons)</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          <strong>Lưu ý:</strong> Hiện tại vui lòng thêm/sửa/xóa mã giảm giá trực tiếp trong tab <strong>Coupons</strong> trên Google Sheets. Các mã sẽ có hiệu lực ngay lập tức.
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase">
              <th className="p-4 font-medium">Mã Code</th>
              <th className="p-4 font-medium">Loại</th>
              <th className="p-4 font-medium">Mức giảm</th>
              <th className="p-4 font-medium">Điều kiện</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((c) => (
              <tr key={c.code} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold text-teal-600 uppercase">{c.code}</td>
                <td className="p-4 text-gray-600">{c.type}</td>
                <td className="p-4 text-gray-800 font-medium">
                  {c.discountValue <= 100 && c.discountValue > 0 
                    ? `${c.discountValue}%` 
                    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.discountValue)}
                </td>
                <td className="p-4 text-gray-500 text-sm">{c.condition || 'Không có'}</td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Chưa có mã giảm giá nào. Vui lòng thêm trong Google Sheets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
