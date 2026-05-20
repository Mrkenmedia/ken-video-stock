"use client";

/**
 * DetailButtonStyleLoader
 * ─────────────────────────────────────────────────────────────────────
 * Fetch key "detailButtonColor" từ /api/settings và inject vào CSS
 * variable --detail-btn-bg trên :root.
 *
 * Component này mount một lần duy nhất trong StorefrontLayout,
 * không render ra DOM nào — chỉ set style trên document.documentElement.
 */

import { useEffect } from 'react';

export default function DetailButtonStyleLoader() {
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const color: string | undefined = data?.detailButtonColor;
        const textColor: string | undefined = data?.detailButtonTextColor;

        const root = document.documentElement;

        if (color && color.trim()) {
          // Nếu là mã màu đơn (hex / rgb), dùng solid; ngược lại dùng nguyên bản (gradient string)
          const isPlainColor = /^#|^rgb/.test(color.trim());
          root.style.setProperty(
            '--detail-btn-bg',
            isPlainColor ? color.trim() : color.trim(),
          );
        }

        if (textColor && textColor.trim()) {
          root.style.setProperty('--detail-btn-text', textColor.trim());
        }
      })
      .catch(() => {
        // Giữ nguyên giá trị CSS mặc định nếu fetch lỗi
      });
  }, []);

  return null; // Không render gì ra DOM
}
