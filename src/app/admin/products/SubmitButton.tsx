"use client";

import { useFormStatus } from 'react-dom';

export default function SubmitButton({ pendingText = 'Đang lưu...', text = 'Lưu Sản Phẩm' }: { pendingText?: string, text?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-6 py-3 rounded-lg text-white font-medium transition-colors shadow-sm ${
        pending ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
      }`}
    >
      {pending ? pendingText : text}
    </button>
  );
}
