import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/google';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    const decodedSku = decodeURIComponent(sku);
    const products = await getProducts();
    const product = products.find(p => p.sku === decodedSku && p.status === 'active');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      sku: product.sku,
      name: product.name,
      thumbnailUrl: product.thumbnailUrl || (product.driveDemoId ? `https://drive.google.com/thumbnail?id=${product.driveDemoId}&sz=w400` : ''),
      priceMp4: product.priceMp4,
      priceMov: product.priceMov,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
