import { getProducts, getTags, getBanners, getSettings } from '@/lib/google';
import VideoCard from '@/components/storefront/VideoCard';
import StorefrontGrid from '@/components/storefront/StorefrontGrid';

// Caching dữ liệu 5 giây (ISR)
export const revalidate = 5;

export default async function StorefrontHome() {
  const [products, tags, banners, settings] = await Promise.all([
    getProducts(),
    getTags(),
    getBanners(),
    getSettings()
  ]);
  const activeProducts = products.filter(p => p.status === 'active');
  const activeBanners = banners.filter(b => b.status !== 'inactive');
  
  let collections = [];
  try {
    if (settings.homepageCollections) {
      const parsed = JSON.parse(settings.homepageCollections);
      const seenIds = new Set<string>();
      collections = parsed.map((c: any) => {
        if (!c.id || seenIds.has(c.id)) {
          return { ...c, id: Math.random().toString(36).substring(7) };
        }
        seenIds.add(c.id);
        return c;
      });
    }
  } catch (e) {
    console.error('Failed to parse collections:', e);
  }

  return (
    <div>
      <StorefrontGrid products={activeProducts} tags={tags} banners={activeBanners} collections={collections} />
    </div>
  );
}
