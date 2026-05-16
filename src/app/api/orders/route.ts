import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID, getProducts } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, format, email, couponCode } = body;

    if (!sku || !format || !email) {
      return NextResponse.json({ error: 'Thiếu thông tin đơn hàng' }, { status: 400 });
    }

    // Lấy sản phẩm thực từ Sheets
    const products = await getProducts();
    const product = products.find(p => p.sku === sku && p.status === 'active');

    if (!product) {
      return NextResponse.json({ error: 'Sản phẩm không tồn tại' }, { status: 404 });
    }

    let price = format.toUpperCase() === 'MOV' ? product.priceMov : product.priceMp4;
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Định dạng này không có sẵn để bán' }, { status: 400 });
    }

    let appliedDiscount = 0;
    if (couponCode) {
      const { getCoupons } = await import('@/lib/google');
      const coupons = await getCoupons();
      const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
      
      if (coupon) {
        if (coupon.discountValue <= 100 && coupon.discountValue > 0) {
          appliedDiscount = (price * coupon.discountValue) / 100;
        } else if (coupon.discountValue > 100) {
          appliedDiscount = coupon.discountValue;
        }
        
        if (appliedDiscount > price) appliedDiscount = price;
        price = price - appliedDiscount;
      } else {
        return NextResponse.json({ error: 'Mã giảm giá không hợp lệ khi tạo đơn' }, { status: 400 });
      }
    }

    // Tạo mã đơn hàng duy nhất
    const timestamp = Date.now().toString().slice(-6);
    const orderId = `DH${timestamp}`;
    const date = new Date().toISOString();

    // Ghi đơn hàng vào tab Orders với trạng thái "pending"
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          orderId,
          date,
          email,
          sku,
          format.toUpperCase(),
          price,
          'pending',
          `Khách tạo đơn lúc ${date}`
        ]]
      }
    });

    return NextResponse.json({
      orderId,
      price,
      transferContent: `${orderId} ${sku}`,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi tạo đơn hàng' }, { status: 500 });
  }
}
