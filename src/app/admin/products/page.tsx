import { getProducts, getTags } from '@/lib/google';
import ProductsManager from './ProductsManager';

export const revalidate = 0; // Tạm thời disable cache cho trang Admin để lấy dữ liệu real-time

export default async function AdminProductsPage() {
  const [products, tags] = await Promise.all([
    getProducts(),
    getTags()
  ]);

  return (
    <ProductsManager 
      initialProducts={products} 
      tags={tags} 
      googleSheetId={process.env.GOOGLE_SHEET_ID} 
    />
  );
}
