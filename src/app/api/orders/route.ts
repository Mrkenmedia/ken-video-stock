import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID, getProducts, getTiers, getCoupons } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, couponCode } = body; // items: [{ sku, format }]

    if (!items || !Array.isArray(items) || items.length === 0 || !email) {
      return NextResponse.json({ error: 'Thiếu thông tin đơn hàng' }, { status: 400 });
    }

    // 1. Lấy dữ liệu thực từ Sheets để tính toán bảo mật
    const [allProducts, allTiers, allCoupons] = await Promise.all([
      getProducts(),
      getTiers(),
      getCoupons()
    ]);

    let rawTotal = 0;
    const validatedItems: string[] = [];

    // 2. Tính giá gốc và kiểm tra tồn tại
    for (const item of items) {
      const product = allProducts.find(p => p.sku === item.sku && p.status === 'active');
      if (!product) continue;

      const price = item.format.toUpperCase() === 'MOV' ? product.priceMov : product.priceMp4;
      if (price > 0) {
        rawTotal += price;
        validatedItems.push(`${item.sku}(${item.format.toUpperCase()})`);
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'Không có sản phẩm hợp lệ trong đơn hàng' }, { status: 400 });
    }

    // 3. Tính toán giảm giá
    let finalPrice = rawTotal;
    let appliedDiscountInfo = 'Giá gốc';

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
