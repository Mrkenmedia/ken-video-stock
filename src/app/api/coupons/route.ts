import { NextResponse } from 'next/server';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon, ensureCouponsSheet } from '@/lib/google';

async function init() {
  await ensureCouponsSheet();
}

export async function GET() {
  try {
    const coupons = await getCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('GET /api/coupons error:', error);
    return NextResponse.json({ error: 'Cannot fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await init();
    const coupon = await request.json();
    if (!coupon.code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    const ok = await addCoupon(coupon);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('POST /api/coupons error:', error);
    return NextResponse.json({ error: 'Cannot add coupon' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await init();
    const { oldCode, coupon } = await request.json();
    if (!oldCode || !coupon) return NextResponse.json({ error: 'Missing oldCode or coupon' }, { status: 400 });
    const ok = await updateCoupon(oldCode, coupon);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('PUT /api/coupons error:', error);
    return NextResponse.json({ error: 'Cannot update coupon' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await init();
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    const ok = await deleteCoupon(code);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('DELETE /api/coupons error:', error);
    return NextResponse.json({ error: 'Cannot delete coupon' }, { status: 500 });
  }
}
