/**
 * ============================================================
 * PROMOTION BANNER CONFIGURATION
 * ============================================================
 * Chỉnh sửa file này để tùy biến toàn bộ banner khuyến mãi
 * mà không cần đụng vào code component.
 */

export const PROMOTION_CONFIG = {
  // ─── Thời gian ───────────────────────────────────────────
  /** Ngày kết thúc khuyến mãi (ISO 8601, bao gồm múi giờ) */
  endDate: '2026-06-30T23:59:59+07:00',

  // ─── Nội dung ────────────────────────────────────────────
  /** Emoji / icon hiển thị hai đầu */
  icon: '🔥',
  /** Tiêu đề chính */
  title: 'KHUYẾN MÃI TOÀN SÀN',
  /** Mô tả phụ (để trống nếu không cần) */
  subtitle: 'Giảm tới 50% — Kho video chất lượng 4K',
  /** Nhãn nút CTA (để trống để ẩn nút) */
  ctaLabel: 'Mua ngay →',
  /** Đường dẫn khi nhấn nút CTA */
  ctaHref: '/',

  // ─── Màu sắc ─────────────────────────────────────────────
  /** Màu gradient bắt đầu (HEX / HSL / rgba đều được) */
  colorFrom: '#ff7a00',
  /** Màu gradient kết thúc */
  colorTo: '#e3008c',
  /** Màu chữ tiêu đề */
  textColor: '#ffffff',
  /** Màu nền đồng hồ đếm ngược */
  timerBg: 'rgba(0,0,0,0.25)',
  /** Màu chữ đồng hồ */
  timerColor: '#ffffff',
  /** Màu nền nút CTA */
  ctaBg: '#ffffff',
  /** Màu chữ nút CTA */
  ctaText: '#e3008c',

  // ─── Font ─────────────────────────────────────────────────
  /** Font cho tiêu đề (Google Fonts name hoặc system font) */
  fontTitle: "'Inter', 'Segoe UI', sans-serif",
  /** Font cho đồng hồ đếm ngược */
  fontTimer: "'Courier New', monospace",

  // ─── Nhãn thời gian (đa ngôn ngữ) ────────────────────────
  labels: {
    days: 'ngày',
    hours: 'giờ',
    minutes: 'phút',
    seconds: 'giây',
  },
} as const;
