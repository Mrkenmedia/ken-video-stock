"use client"

import { useEffect, useState } from "react"
import { Coupon } from "@/types"

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Form state
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [formData, setFormData] = useState<Coupon>({
    code: "",
    type: "global",
    discountValue: 0,
    condition: ""
  })

  const fetchCoupons = async () => {
    setIsLoading(true)
    const res = await fetch("/api/coupons")
    if (res.ok) {
      const data = await res.json()
      setCoupons(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const resetForm = () => {
    setFormData({ code: "", type: "global", discountValue: 0, condition: "" })
    setEditingCode(null)
    setIsFormOpen(false)
  }

  const openAddForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (coupon: Coupon) => {
    setFormData(coupon)
    setEditingCode(coupon.code)
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    if (editingCode) {
      await fetch("/api/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldCode: editingCode, coupon: formData }),
      })
    } else {
      await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
    }
    
    resetForm()
    await fetchCoupons()
    setIsSubmitting(false)
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"?`)) return
    setIsSubmitting(true)
    await fetch("/api/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    await fetchCoupons()
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Mã Giảm Giá</h1>
          <p className="text-gray-500 mt-2">Thêm, sửa, xóa mã giảm giá (Coupons) cho khách hàng.</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Thêm mã mới
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">{editingCode ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã Code</label>
                <input
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase"
                  placeholder="VD: SUMMER2024"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại mã</label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as 'global' | 'exclusive'})}
                >
                  <option value="global">Global (Áp dụng chung)</option>
                  <option value="exclusive">Exclusive (Độc quyền)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mức giảm</label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="number"
                    min="1"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="VD: 20 hoặc 50000"
                    value={formData.discountValue || ''}
                    onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                  />
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2.5 rounded-lg border border-gray-200">
                    {formData.discountValue <= 100 && formData.discountValue > 0 ? '%' : 'VNĐ'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Nhập số ≤ 100 hệ thống hiểu là % (VD: 20 là giảm 20%). Nhập &gt; 100 hệ thống hiểu là VNĐ (VD: 50000 là giảm 50k).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Điều kiện (Tùy chọn)</label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="VD: Đơn hàng > 200k"
                  value={formData.condition || ''}
                  onChange={e => setFormData({...formData, condition: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu mã giảm giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase">
              <th className="p-5 font-semibold">Mã Code</th>
              <th className="p-5 font-semibold">Loại</th>
              <th className="p-5 font-semibold">Mức giảm</th>
              <th className="p-5 font-semibold">Điều kiện</th>
              <th className="p-5 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <svg className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">Chưa có mã giảm giá nào</p>
                  <p>Hãy bấm Thêm mã mới để tạo khuyến mãi cho khách hàng.</p>
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.code} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-5 font-bold text-teal-600 uppercase text-lg">{c.code}</td>
                  <td className="p-5 text-gray-600">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.type === 'global' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {c.type === 'global' ? 'Global' : 'Exclusive'}
                    </span>
                  </td>
                  <td className="p-5 text-gray-900 font-bold text-lg">
                    {c.discountValue <= 100 && c.discountValue > 0 
                      ? `${c.discountValue}%` 
                      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.discountValue)}
                  </td>
                  <td className="p-5 text-gray-500 text-sm">{c.condition || <span className="text-gray-300 italic">Không có</span>}</td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditForm(c)}
                        className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(c.code)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
