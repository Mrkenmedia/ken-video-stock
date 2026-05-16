import { getProducts, getTags } from '@/lib/google';
import VideoCard from '@/components/storefront/VideoCard';
import StorefrontGrid from '@/components/storefront/StorefrontGrid';

// Caching dữ liệu 60 giây (ISR) theo yêu cầu PRD
export const revalidate = 60;

export default async function StorefrontHome() {
  const [products, tags] = await Promise.all([
    getProducts(),
    getTags()
  ]);
  const activeProducts = products.filter(p => p.status === 'active');

  return (
    <div>
      <StorefrontGrid products={activeProducts} tags={tags} />
    </div>
  );
}
