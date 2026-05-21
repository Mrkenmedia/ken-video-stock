'use client';

import { useState, useEffect } from 'react';

export function useFlashSale(settings?: any) {
  const [percent, setPercent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  useEffect(() => {
    // Read from localStorage first for instant client rendering
    const cachedPercent = localStorage.getItem('ken_flash_sale_percent');
    const cachedDuration = localStorage.getItem('ken_flash_sale_duration');
    const cachedStart = localStorage.getItem('ken_flash_sale_start');
    
    if (cachedPercent && cachedDuration && cachedStart) {
      const p = parseFloat(cachedPercent);
      const d = parseFloat(cachedDuration);
      const s = parseInt(cachedStart);
      setPercent(p);
      setDuration(d);
      setStartTime(s);
      
      const elapsed = Date.now() - s;
      setTimeLeftMs(Math.max(0, (d * 60 * 1000) - elapsed));
    }

    // Use provided settings instead of fetching
    if (settings) {
      if (settings.newUserFlashSalePercent && settings.newUserFlashSaleDuration) {
        const p = parseFloat(settings.newUserFlashSalePercent);
        const d = parseFloat(settings.newUserFlashSaleDuration);
        
        if (p > 0 && d > 0) {
          setPercent(p);
          setDuration(d);
          localStorage.setItem('ken_flash_sale_percent', p.toString());
          localStorage.setItem('ken_flash_sale_duration', d.toString());
          
          let s = localStorage.getItem('ken_flash_sale_start');
          if (!s) {
            s = Date.now().toString();
            localStorage.setItem('ken_flash_sale_start', s);
          }
          const startVal = parseInt(s);
          setStartTime(startVal);
          
          const elapsed = Date.now() - startVal;
          setTimeLeftMs(Math.max(0, (d * 60 * 1000) - elapsed));
        } else {
          // Flash sale turned off by admin
          setPercent(0);
          localStorage.removeItem('ken_flash_sale_percent');
          localStorage.removeItem('ken_flash_sale_duration');
          localStorage.removeItem('ken_flash_sale_start');
        }
      } else {
        // No flash sale settings
        setPercent(0);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (!startTime || !duration || percent <= 0) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration * 60 * 1000) - elapsed);
      setTimeLeftMs(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration, percent]);

  const isFlashSaleActive = percent > 0 && timeLeftMs > 0;

  return {
    isFlashSaleActive,
    flashSalePercent: isFlashSaleActive ? percent : 0,
    timeLeftMs,
    flashSaleStart: startTime
  };
}
