import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getProducts();
    const activeProducts = products
      .filter(p => p.status === 'active')
      .map(p => ({
        sku: p.sku,
        name: p.name,
        priceMp4: p.priceMp4,
        priceMov: p.priceMov,
      }));

    return NextResponse.json(activeProducts, {
      headers: {
        // Cache tại browser/CDN 60 giây, sau đó dùng lại cache (stale) trong 5 phút
        // trong khi server âm thầm làm mới – giảm số request tới Google Sheets
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
