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

    return NextResponse.json(
      {
        sku: product.sku,
        name: product.name,
        thumbnailUrl: product.thumbnailUrl || ((product.driveDemoId || product.driveGocMp4Id || product.driveGocMovId) ? `https://drive.google.com/thumbnail?id=${product.driveDemoId || product.driveGocMp4Id || product.driveGocMovId}&sz=w400` : ''),
        priceMp4: product.priceMp4,
        priceMov: product.priceMov,
      },
      {
        headers: {
          // Trang chi tiết sản phẩm ít thay đổi → cache 5 phút, stale 10 phút
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
