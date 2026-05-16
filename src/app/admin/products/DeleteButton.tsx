"use client";

import { useTransition } from "react";
import { deleteProductAction } from "./actions";

export default function DeleteButton({ sku }: { sku: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa video có mã SKU: ${sku} không? Hành động này sẽ xóa dòng dữ liệu trên Google Sheets và không thể hoàn tác!`)) {
      startTransition(async () => {
        const res = await deleteProductAction(sku);
        if (!res.success) {
          alert("Xóa thất bại: " + res.message);
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className={`text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors inline-block ml-2 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPending ? 'Đang xóa...' : 'Xóa'}
    </button>
  );
}
