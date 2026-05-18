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
    return NextResponse.json(activeProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
