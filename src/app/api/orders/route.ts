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

    let baseTotal = 0;
    let flashSaleTotal = 0;
    const validatedItems: string[] = [];

    // 2. Tính giá gốc và kiểm tra tồn tại
    for (const item of items) {
      const product = allProducts.find(p => p.sku === item.sku && p.status === 'active');
      if (!product) continue;

      const basePrice = item.format.toUpperCase() === 'MOV' ? product.priceMov : product.priceMp4;
      if (basePrice > 0) {
        baseTotal += basePrice;
        
        const fsPrice = isFlashSaleActive
          ? Math.round((basePrice * (1 - flashSalePercent / 100)) / 1000) * 1000
          : basePrice;
        flashSaleTotal += fsPrice;

        validatedItems.push(`${item.sku}(${item.format.toUpperCase()})`);
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'Không có sản phẩm hợp lệ trong đơn hàng' }, { status: 400 });
    }

    // 3. Tính toán giảm giá và kiểm tra Coupon
    let appliedCoupon = null;
    let isExclusive = false;
    if (couponCode) {
      appliedCoupon = allCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
      if (appliedCoupon) {
        isExclusive = appliedCoupon.type === 'exclusive';
      }
    }

    let finalPrice = baseTotal;
    let appliedDiscountInfo = 'Giá gốc';

    if (isExclusive && appliedCoupon) {
      // Loại 2: Độc quyền (Không áp dụng bất kỳ khuyến mãi nào khác)
      let discountAmount = 0;
      if (appliedCoupon.discountValue <= 100 && appliedCoupon.discountValue > 0) {
        discountAmount = (baseTotal * appliedCoupon.discountValue) / 100;
      } else {
        discountAmount = appliedCoupon.discountValue;
      }
      if (discountAmount > baseTotal) discountAmount = baseTotal;
      
      finalPrice = baseTotal - discountAmount;
      appliedDiscountInfo = `Mã độc quyền: ${appliedCoupon.code}`;
    } else {
      // Loại 1: Cộng dồn (Áp dụng trên giá đã giảm của Tier hoặc Flash Sale)
      let currentTotal = baseTotal;
      const appliedInfoParts = [];

      if (isFlashSaleActive) {
        currentTotal = flashSaleTotal;
        appliedInfoParts.push(`Flash Sale Khách Mới (-${flashSalePercent}%)`);
      } else {
        const activeTier = allTiers.find(t => validatedItems.length >= t.minItems);
        if (activeTier) {
          const tierDiscount = Math.round((currentTotal * activeTier.discountPercent) / 100);
          currentTotal -= tierDiscount;
          appliedInfoParts.push(`Tier (-${activeTier.discountPercent}%)`);
        }
      }

      if (appliedCoupon) {
        let discountAmount = 0;
        if (appliedCoupon.discountValue <= 100 && appliedCoupon.discountValue > 0) {
          discountAmount = (currentTotal * appliedCoupon.discountValue) / 100;
        } else {
          discountAmount = appliedCoupon.discountValue;
        }
        if (discountAmount > currentTotal) discountAmount = currentTotal;
        
        currentTotal -= discountAmount;
        appliedInfoParts.push(`Mã: ${appliedCoupon.code}`);
      }

      finalPrice = currentTotal;
      if (appliedInfoParts.length > 0) {
        appliedDiscountInfo = appliedInfoParts.join(' + ');
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
