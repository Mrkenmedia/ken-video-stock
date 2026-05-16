"use client"

import { useEffect, useState } from "react"

export default function TagsAdminPage() {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const fetchTags = async () => {
    const res = await fetch("/api/tags")
    if (res.ok) {
      const data = await res.json()
      setTags(data)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleAdd = async () => {
    if (!newTag.trim()) return
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: newTag.trim() }),
    })
    setNewTag("")
    fetchTags()
  }

  const startEdit = (tag: string) => {
    setEditing(tag)
    setEditValue(tag)
  }

  const handleUpdate = async (oldTag: string) => {
    if (!editValue.trim()) return
    await fetch("/api/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldTag, newTag: editValue.trim() }),
    })
    setEditing(null)
    fetchTags()
  }

  const handleDelete = async (tag: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tag "${tag}"?`)) return
    await fetch("/api/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    })
    fetchTags()
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Quản lý Thể Loại (Tags)</h1>

      {/* Add New Tag */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          placeholder="Thêm tag mới"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
        />
        <button
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl"
          onClick={handleAdd}
        >Add</button>
      </div>

      {/* Tag List */}
      <ul className="space-y-3">
        {tags.map(tag => (
          <li key={tag} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            {editing === tag ? (
              <>
                <input
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                />
                <button
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                  onClick={() => handleUpdate(tag)}
                >Save</button>
                <button
                  className="text-slate-400 hover:text-white"
                  onClick={() => setEditing(null)}
                >Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-white">{tag}</span>
                <button
                  className="text-cyan-400 hover:text-cyan-300"
                  onClick={() => startEdit(tag)}
                >Edit</button>
                <button
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(tag)}
                >Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
