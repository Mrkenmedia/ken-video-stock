import { getProducts, getTags, getBanners } from '@/lib/google';
import VideoCard from '@/components/storefront/VideoCard';
import StorefrontGrid from '@/components/storefront/StorefrontGrid';

// Caching dữ liệu 60 giây (ISR) theo yêu cầu PRD
export const revalidate = 60;

export default async function StorefrontHome() {
  const [products, tags, banners] = await Promise.all([
    getProducts(),
    getTags(),
    getBanners()
  ]);
  const activeProducts = products.filter(p => p.status === 'active');
  const activeBanners = banners.filter(b => b.status !== 'inactive');

  return (
    <div>
      <StorefrontGrid products={activeProducts} tags={tags} banners={activeBanners} />
    </div>
  );
}
