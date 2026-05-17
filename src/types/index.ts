export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  sku: string;
  name: string;
  slug: string;
  tags: string[];
  thumbnailUrl: string;
  driveDemoId: string;
  driveGocMp4Id: string;
  priceMp4: number;
  driveGocMovId: string;
  priceMov: number;
  originalPriceMp4?: number;
  originalPriceMov?: number;
  licenseType: string;
  status: 'active' | 'inactive';
  description?: string;
  resolution?: string;
  duration?: string;
  fps?: string;
  size?: string;
  id?: string;
  stt?: number;
}

export interface Bundle {
  id: string;
  name: string;
  skus: string[];
  price: number;
}

export interface Order {
  orderId: string;
  date: string;
  customerEmail: string;
  sku: string;
  format: string; // MP4, MOV, or Combo
  totalPrice: number;
  status: 'pending' | 'completed' | 'failed';
  logs: string;
}

export interface Coupon {
  code: string;
  type: 'global' | 'exclusive';
  discountValue: number; // percentage or fixed amount
  condition: string;
}

export interface Settings {
  emailTemplate: string;
  telegramToken: string;
  telegramChatId: string;
  progressivePricing: string; // JSON string of progressive pricing rules
  globalDiscountPercent?: string;
  globalDiscountStart?: string;
  globalDiscountEnd?: string;
  newUserFlashSalePercent?: string;
  newUserFlashSaleDuration?: string;
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  linkUrl?: string;
  order: number;
}
