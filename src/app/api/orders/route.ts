import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID, getProducts, getTiers, getCoupons, getSettings } from '@/lib/google';
import { Settings } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, couponCode, flashSaleStart } = body; // items: [{ sku, format }]

    if (!items || !Array.isArray(items) || items.length === 0 || !email) {
      return NextResponse.json({ error: 'Thiếu thông tin đơn hàng' }, { status: 400 });
    }

    // 1. Lấy dữ liệu thực từ Sheets để tính toán bảo mật
    const [allProducts, allTiers, allCoupons, settingsData] = await Promise.all([
      getProducts(),
      getTiers(),
      getCoupons(),
      getSettings().catch(() => ({}))
    ]);

    // Kiểm tra tính hợp lệ của Flash Sale
    const settings = settingsData as Partial<Settings>;
    const flashSalePercent = parseFloat(settings.newUserFlashSalePercent || '0');
    const flashSaleDuration = parseFloat(settings.newUserFlashSaleDuration || '0');
    let isFlashSaleActive = false;

    if (flashSalePercent > 0 && flashSaleDuration > 0 && flashSaleStart) {
      const start = parseInt(flashSaleStart);
      const elapsed = Date.now() - start;
      if (start > 0 && elapsed >= 0 && elapsed < (flashSaleDuration * 60 * 1000)) {
        isFlashSaleActive = true;
      }
    }

    let rawTotal = 0;
    const validatedItems: string[] = [];

    // 2. Tính giá gốc và kiểm tra tồn tại
    for (const item of items) {
      const product = allProducts.find(p => p.sku === item.sku && p.status === 'active');
      if (!product) continue;

      const basePrice = item.format.toUpperCase() === 'MOV' ? product.priceMov : product.priceMp4;
      if (basePrice > 0) {
        const finalPrice = isFlashSaleActive
          ? Math.round((basePrice * (1 - flashSalePercent / 100)) / 1000) * 1000
          : basePrice;

        rawTotal += finalPrice;
        validatedItems.push(`${item.sku}(${item.format.toUpperCase()})`);
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'Không có sản phẩm hợp lệ trong đơn hàng' }, { status: 400 });
    }

    // 3. Tính toán giảm giá
    let finalPrice = rawTotal;
    let appliedDiscountInfo = isFlashSaleActive
      ? `Flash Sale Khách Mới (-${flashSalePercent}%)`
      : 'Giá gốc';

    if (!isFlashSaleActive) {
      // Ưu tiên 1: Giá lũy tiến (Tiers)
      const activeTier = allTiers.find(t => validatedItems.length >= t.minItems);
      if (activeTier) {
        const discountAmount = Math.round((rawTotal * activeTier.discountPercent) / 100);
        finalPrice = rawTotal - discountAmount;
        appliedDiscountInfo = `Giảm ${activeTier.discountPercent}% (Tier ${activeTier.minItems}+ items)`;
      } 
      // Ưu tiên 2: Coupon (Chỉ khi không có Tier)
      else if (couponCode) {
        const coupon = allCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
        if (coupon) {
          let couponDiscount = 0;
          if (coupon.discountValue <= 100 && coupon.discountValue > 0) {
            couponDiscount = (rawTotal * coupon.discountValue) / 100;
          } else {
            couponDiscount = coupon.discountValue;
          }
          finalPrice = Math.max(0, rawTotal - couponDiscount);
          appliedDiscountInfo = `Mã: ${coupon.code}`;
        }
      }
    }

    // 4. Tạo mã đơn hàng
    const timestamp = Date.now().toString().slice(-6);
    const orderId = `DH${timestamp}`;
    const date = new Date().toISOString();

    // 5. Ghi vào Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          orderId,
          date,
          email,
          validatedItems.join(', '),
          'MULTIPLE',
          finalPrice,
          'pending',
          `Khách tạo đơn ${validatedItems.length} file. ${appliedDiscountInfo}`
        ]]
      }
    });

    return NextResponse.json({
      orderId,
      price: finalPrice,
      transferContent: `${orderId} KEN`, // Nội dung rút gọn
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi tạo đơn hàng' }, { status: 500 });
  }
}
