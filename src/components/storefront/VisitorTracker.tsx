"use client";

import { useEffect, useRef } from 'react';
import { trackVisitAction } from '@/lib/actions/track';

export default function VisitorTracker({ enabled = true }: { enabled?: boolean }) {
  const tracked = useRef(false);

  useEffect(() => {
    // Chỉ track 1 lần mỗi khi mở tab (sử dụng sessionStorage)
    if (tracked.current) return;
    
    const hasTracked = sessionStorage.getItem('hasTrackedVisit');
    if (!hasTracked) {
      tracked.current = true;
      sessionStorage.setItem('hasTrackedVisit', 'true');
      
      const info = {
        url: window.location.href,
        referrer: document.referrer || 'Trực tiếp',
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        userAgent: navigator.userAgent
      };
      
      // Chờ 2 giây rồi mới gửi để tránh làm chậm lần render đầu tiên
      setTimeout(() => {
        trackVisitAction(info, enabled).catch(console.error);
      }, 2000);
    }
  }, [enabled]);

  return null;
}
