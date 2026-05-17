"use client"

import { useEffect, useState } from "react"

export default function TagsAdminPage() {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTags = async () => {
    setIsLoading(true)
    const res = await fetch("/api/tags")
    if (res.ok) {
      const data = await res.json()
      setTags(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim() || isSubmitting) return
    setIsSubmitting(true)
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: newTag.trim() }),
    })
    setNewTag("")
    await fetchTags()
    setIsSubmitting(false)
  }

  const startEdit = (tag: string) => {
    setEditing(tag)
    setEditValue(tag)
  }

  const handleUpdate = async (oldTag: string) => {
    if (!editValue.trim() || isSubmitting) return
    setIsSubmitting(true)
    await fetch("/api/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldTag, newTag: editValue.trim() }),
    })
    setEditing(null)
    await fetchTags()
    setIsSubmitting(false)
  }

  const handleDelete = async (tag: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thể loại "${tag}"? Hành động này không thể hoàn tác.`)) return
    setIsSubmitting(true)
    await fetch("/api/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    })
    await fetchTags()
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Thể Loại (Tags)</h1>
        <p className="text-gray-500 mt-2">Thêm, sửa, xóa các thể loại video. Các thể loại này sẽ tự động được hiển thị trên trang Khám phá Cửa hàng.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
              placeholder="Nhập tên thể loại mới (VD: Thiên nhiên, Công nghệ...)"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newTag.trim() || isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Thêm mới
            </button>
          </form>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Đang tải danh sách thể loại...
            </div>
          ) : tags.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Chưa có thể loại nào</p>
              <p>Hãy thêm thể loại đầu tiên bằng biểu mẫu bên trên.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tags.map(tag => (
                <li key={tag} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                  {editing === tag ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        className="flex-1 bg-white border border-teal-500 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate(tag)
                          if (e.key === 'Escape') setEditing(null)
                        }}
                      />
                      <button
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        onClick={() => handleUpdate(tag)}
                        disabled={isSubmitting || !editValue.trim()}
                      >Lưu</button>
                      <button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                        onClick={() => setEditing(null)}
                        disabled={isSubmitting}
                      >Hủy</button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      </div>
                      <span className="flex-1 font-medium text-gray-900">{tag}</span>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          onClick={() => startEdit(tag)}
                          title="Sửa"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => handleDelete(tag)}
                          title="Xóa"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
