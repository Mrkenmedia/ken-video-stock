"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PROMOTION_CONFIG as C } from '@/config/promotion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  const KEY = 'promo_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function isNewSession(): boolean {
  const KEY = 'promo_seen';
  const seen = sessionStorage.getItem(KEY);
  if (!seen) {
    sessionStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PromotionBanner() {
  const [loading, setLoading] = useState(true);
  const [promotionEndMs, setPromotionEndMs] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [visible, setVisible] = useState(true);
  const tracked = useRef(false);

  // States lấy từ Settings API
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoTitle, setPromoTitle] = useState(C.title);
  const [promoSubtitle, setPromoSubtitle] = useState(C.subtitle || '');
  const [promoColorFrom, setPromoColorFrom] = useState(C.colorFrom);
  const [promoColorTo, setPromoColorTo] = useState(C.colorTo);
  const [promoTextColor, setPromoTextColor] = useState(C.textColor);
  const [promoCtaLabel, setPromoCtaLabel] = useState(C.ctaLabel || '');
  const [promoCtaBg, setPromoCtaBg] = useState(C.ctaBg);
  const [promoCtaText, setPromoCtaText] = useState(C.ctaText);

  // Fetch dữ liệu từ settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const percent = Number(data?.globalDiscountPercent) || 0;
        setDiscountPercent(percent);

        // Logic ẩn banner nếu không có giảm giá
        if (percent <= 0) {
          setVisible(false);
          setLoading(false);
          return;
        }

        // Đọc thời gian bắt đầu (nếu có cài)
        const startStr: string = data?.globalDiscountStart || '';
        if (startStr) {
          const startMs = new Date(startStr.includes('+') ? startStr : startStr + '+07:00').getTime();
          if (Date.now() < startMs) {
            setVisible(false); // Chưa tới lúc bắt đầu
            setLoading(false);
            return;
          }
        }

        // Đọc thời gian kết thúc
        const endStr: string = data?.globalDiscountEnd || '';
        let endMs: number = 0;
        if (endStr) {
          endMs = new Date(endStr.includes('+') ? endStr : endStr + '+07:00').getTime();
        } else {
          endMs = new Date(C.endDate).getTime();
        }

        if (Date.now() > endMs) {
          setVisible(false); // Đã hết hạn
          setLoading(false);
          return;
        }

        // Load custom UI
        if (data.promoTitle) setPromoTitle(data.promoTitle);
        if (data.promoSubtitle) setPromoSubtitle(data.promoSubtitle);
        if (data.promoColorFrom) setPromoColorFrom(data.promoColorFrom);
        if (data.promoColorTo) setPromoColorTo(data.promoColorTo);
        if (data.promoTextColor) setPromoTextColor(data.promoTextColor);
        if (data.promoCtaLabel) setPromoCtaLabel(data.promoCtaLabel);
        if (data.promoCtaBg) setPromoCtaBg(data.promoCtaBg);
        if (data.promoCtaText) setPromoCtaText(data.promoCtaText);

        setPromotionEndMs(endMs);
        setTimeLeft(endMs - Date.now());
        setLoading(false);
      })
      .catch(() => {
        // Fallback nếu lỗi mạng
        const endMs = new Date(C.endDate).getTime();
        setPromotionEndMs(endMs);
        setTimeLeft(endMs - Date.now());
        setLoading(false);
      });
  }, []);

  // Đếm ngược — chỉ chạy sau khi có promotionEndMs
  useEffect(() => {
    if (!promotionEndMs) return;
    const id = setInterval(() => {
      setTimeLeft(promotionEndMs - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [promotionEndMs]);


  // Tracking: ghi nhận lần xem (1 lần duy nhất khi banner mount)
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const newSession = isNewSession();
    getOrCreateSessionId(); // đảm bảo session ID tồn tại

    fetch('/api/promotion-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isNewSession: newSession }),
    }).catch(() => { /* silent fail — tracking không được làm ảnh hưởng UX */ });
  }, []);

  // Ẩn banner nếu đang load, hết hạn, hoặc bị người dùng đóng, hoặc bị ẩn do logic % giảm giá
  if (loading || timeLeft <= 0 || !visible) return null;

  // ─── Tính thời gian ──────────────────────────────────────────────────────
  const days    = Math.floor(timeLeft / 86_400_000);
  const hours   = Math.floor((timeLeft % 86_400_000) / 3_600_000);
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000);
  const seconds = Math.floor((timeLeft % 60_000) / 1_000);

  const pad = (n: number) => String(n).padStart(2, '0');

  // ─── Inline styles động từ state ─────────────────────────────────────────────
  const bannerStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${promoColorFrom}, ${promoColorTo})`,
    color: promoTextColor,
    fontFamily: C.fontTitle,
  };

  const timerStyle: React.CSSProperties = {
    background: C.timerBg,
    color: C.timerColor,
    fontFamily: C.fontTimer,
  };

  const ctaStyle: React.CSSProperties = {
    background: promoCtaBg,
    color: promoCtaText,
  };

  // Replace {discount} bằng phần trăm giảm giá thực tế
  const formattedSubtitle = promoSubtitle.replace('{discount}', discountPercent.toString());

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={bannerStyle} className="promo-banner" role="banner" aria-label="Chương trình khuyến mãi">
      {/* Hiệu ứng ánh sáng chạy ngang */}
      <div className="promo-shine" aria-hidden="true" />

      <div className="promo-content">
        {/* Icon + Tiêu đề */}
        <span className="promo-title">
          {C.icon} {promoTitle} {C.icon}
        </span>

        {/* Mô tả phụ */}
        {formattedSubtitle && (
          <span className="promo-subtitle">{formattedSubtitle}</span>
        )}

        {/* Đồng hồ đếm ngược */}
        <div className="promo-clock" aria-label="Thời gian còn lại">
          {[
            { value: days,    label: C.labels.days    },
            { value: hours,   label: C.labels.hours   },
            { value: minutes, label: C.labels.minutes },
            { value: seconds, label: C.labels.seconds },
          ].map(({ value, label }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span className="promo-colon">:</span>}
              <span className="promo-unit" style={timerStyle}>
                <span className="promo-num">{pad(value)}</span>
                <span className="promo-label">{label}</span>
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Nút CTA */}
        {promoCtaLabel && (
          <Link href={C.ctaHref} className="promo-cta" style={ctaStyle}>
            {promoCtaLabel}
          </Link>
        )}
      </div>

      {/* Nút đóng */}
      <button
        className="promo-close"
        onClick={() => setVisible(false)}
        aria-label="Đóng banner khuyến mãi"
      >
        ×
      </button>

      <style>{`
        .promo-banner {
          position: relative;
          width: 100%;
          padding: 0.6rem 3rem 0.6rem 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          animation: promoBannerIn 0.6s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes promoBannerIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        /* Hiệu ứng ánh sáng chạy */
        .promo-shine {
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          animation: promoShine 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes promoShine {
          0%   { left: -60%; }
          60%  { left: 120%; }
          100% { left: 120%; }
        }

        .promo-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          z-index: 1;
        }

        .promo-title {
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 0.04em;
          text-shadow: 0 0 8px rgba(255,255,255,0.5);
          white-space: nowrap;
        }

        .promo-subtitle {
          font-size: 0.85rem;
          font-weight: 500;
          opacity: 0.92;
          white-space: nowrap;
        }

        /* Đồng hồ */
        .promo-clock {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .promo-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          border-radius: 6px;
          padding: 0.15rem 0.4rem;
          min-width: 3rem;
          animation: promoTick 1s step-end infinite;
        }
        @keyframes promoTick {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
        .promo-num {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.05em;
        }
        .promo-label {
          font-size: 0.6rem;
          font-weight: 500;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .promo-colon {
          font-size: 1.1rem;
          font-weight: 700;
          opacity: 0.7;
          margin-bottom: 0.5rem;
          animation: promoBlink 1s step-end infinite;
        }
        @keyframes promoBlink {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 0.2; }
        }

        /* CTA Button */
        .promo-cta {
          display: inline-block;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-decoration: none;
          white-space: nowrap;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .promo-cta:hover {
          transform: scale(1.06);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }

        /* Nút đóng */
        .promo-close {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.2);
          border: none;
          color: #fff;
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 50%;
          font-size: 1.1rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          z-index: 2;
        }
        .promo-close:hover {
          background: rgba(255,255,255,0.4);
        }

        @media (max-width: 640px) {
          .promo-subtitle { display: none; }
          .promo-title { font-size: 0.85rem; }
          .promo-num { font-size: 0.9rem; }
          .promo-unit { min-width: 2.4rem; }
        }
      `}</style>
    </div>
  );
}
