import { NextResponse } from 'next/server';
import { getCoupons, ensureCouponsSheet } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const { code, cartTotal } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Vui lòng nhập mã giảm giá' }, { status: 400 });
    }

    await ensureCouponsSheet();
    const coupons = await getCoupons();
    
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    
    if (!coupon) {
      return NextResponse.json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' }, { status: 400 });
    }

    let discountAmount = 0;
    // Nếu discountValue <= 100, hiểu là phần trăm (%). VD: 20 là giảm 20%.
    // Nếu discountValue > 100, hiểu là số tiền cố định (VD: 50000 là giảm 50.000đ).
    if (coupon.discountValue <= 100 && coupon.discountValue > 0) {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else if (coupon.discountValue > 100) {
      discountAmount = coupon.discountValue;
    }

    // Đảm bảo không giảm quá tổng đơn hàng
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    return NextResponse.json({
      success: true,
      discountAmount,
      couponCode: coupon.code,
      message: 'Áp dụng mã giảm giá thành công!'
    });
  } catch (error) {
    console.error('Coupon apply error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi kiểm tra mã.' }, { status: 500 });
  }
}
