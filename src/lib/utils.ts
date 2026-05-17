/**
 * Generates a unique, deterministic 5-digit ID with prefix 'KV-' corresponding to a SKU.
 */
export function generateIdFromSku(sku: string): string {
  if (!sku) return '';
  let hash = 0;
  for (let i = 0; i < sku.length; i++) {
    hash = (hash << 5) - hash + sku.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Generate a clean 5-digit number between 10000 and 99999
  const idNum = Math.abs(hash) % 90000 + 10000; 
  return `KV-${idNum}`;
}
