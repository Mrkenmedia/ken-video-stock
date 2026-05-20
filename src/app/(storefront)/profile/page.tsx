import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getOrdersByEmail, getProducts } from "@/lib/google";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";

export const revalidate = 0; // Disable caching for profile

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect("/api/auth/signin"); // Automatically redirects to Google login (or default next-auth page)
  }

  // Fetch orders and products
  const orders = await getOrdersByEmail(session.user.email);
  const products = await getProducts();

  // Combine orders with product details (to get actual Drive links)
  const enrichedOrders = orders.map((order: any) => {
    // Parse itemsStr: "SKU1(MP4), SKU2(MOV)"
    const itemStrings = order.itemsStr ? order.itemsStr.split(',').map((s: string) => s.trim()) : [];
    
    const items = itemStrings.map((itemStr: string) => {
      const match = itemStr.match(/(.+)\((.+)\)/);
      let sku = itemStr;
      let format = 'MP4';
      
      if (match) {
        sku = match[1];
        format = match[2];
      }
      
      const product = products.find(p => p.sku === sku);
      
      let link = null;
      if (product) {
        const fileId = format.toUpperCase() === 'MOV' ? product.driveGocMovId : product.driveGocMp4Id;
        if (fileId) {
          link = `https://drive.google.com/file/d/${fileId}/view`;
        }
      }

      return {
        sku,
        format,
        name: product?.name || 'Sản phẩm không xác định',
        thumbnailUrl: product?.thumbnailUrl || '',
        link
      };
    });

    return {
      ...order,
      items
    };
  });

  // Sort orders by date descending
  enrichedOrders.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ProfileContent 
      user={{
        name: session.user.name || '',
        email: session.user.email,
        image: session.user.image || ''
      }} 
      orders={enrichedOrders} 
      products={products}
    />
  );
}
