import { getProducts } from './src/lib/google';

async function debug() {
  const products = await getProducts();
  console.log('--- PRODUCT DATA DEBUG ---');
  products.slice(0, 5).forEach(p => {
    console.log(`SKU: [${p.sku}] | Slug in Sheets: [${p.slug}] | Name: [${p.name}]`);
  });
}

debug();
