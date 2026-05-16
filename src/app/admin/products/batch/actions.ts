"use server";

import { drive, sheets, SPREADSHEET_ID } from '@/lib/google';
import { revalidatePath } from 'next/cache';

// Helper to extract Drive Folder ID from URL
function extractFolderId(url: string) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url; // Fallback to raw string if it's already an ID
}

export async function scanDriveFolderAndImport(formData: FormData) {
  try {
    const folderUrl = formData.get('folderUrl') as string;
    const folderId = extractFolderId(folderUrl);
    
    const priceMp4 = parseFloat(formData.get('priceMp4') as string) || 0;
    const priceMov = parseFloat(formData.get('priceMov') as string) || 0;
    const tagsInput = formData.get('tags') as string;
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
    const status = (formData.get('status') as string) || 'active';

    if (!folderId) throw new Error("Invalid Folder URL or ID");

    // 1. Get subfolders (DEMO_Name, MP4_Name, MOV_Name)
    const resSubfolders = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    const subfolders = resSubfolders.data.files || [];
    
    // Determine which folder is which based on name
    const demoFolder = subfolders.find(f => f.name?.toLowerCase().includes('demo'));
    const mp4Folder = subfolders.find(f => f.name?.toLowerCase().includes('mp4'));
    const movFolder = subfolders.find(f => f.name?.toLowerCase().includes('mov'));

    // 2. Fetch files from all 3 folders in parallel
    const [demoFiles, mp4Files, movFiles] = await Promise.all([
      demoFolder ? drive.files.list({ q: `'${demoFolder.id}' in parents and trashed = false`, fields: 'files(id, name, thumbnailLink)' }).then(r => r.data.files || []) : [],
      mp4Folder ? drive.files.list({ q: `'${mp4Folder.id}' in parents and trashed = false`, fields: 'files(id, name)' }).then(r => r.data.files || []) : [],
      movFolder ? drive.files.list({ q: `'${movFolder.id}' in parents and trashed = false`, fields: 'files(id, name)' }).then(r => r.data.files || []) : []
    ]);

    // 3. Group files by base name
    const productMap = new Map<string, any>();

    // Helper to get base name (remove _demo, _mp4, _mov and extensions)
    const getBaseName = (filename: string) => {
      let base = filename.replace(/\.[^/.]+$/, ""); // remove extension
      base = base.replace(/_(demo|mp4|mov)$/i, ""); // remove suffix
      return base;
    };

    // Process Demos
    demoFiles.forEach(file => {
      const baseName = getBaseName(file.name || '');
      if (!productMap.has(baseName)) productMap.set(baseName, { name: baseName, demoId: '', mp4Id: '', movId: '', thumbnail: '' });
      productMap.get(baseName).demoId = file.id;
      // Get the largest thumbnail possible, replace =s220 with =s800
      let thumb = file.thumbnailLink || '';
      if (thumb) thumb = thumb.replace('=s220', '=s800');
      productMap.get(baseName).thumbnail = thumb;
    });

    // Process MP4s
    mp4Files.forEach(file => {
      const baseName = getBaseName(file.name || '');
      if (!productMap.has(baseName)) productMap.set(baseName, { name: baseName, demoId: '', mp4Id: '', movId: '' });
      productMap.get(baseName).mp4Id = file.id;
    });

    // Process MOVs
    movFiles.forEach(file => {
      const baseName = getBaseName(file.name || '');
      if (!productMap.has(baseName)) productMap.set(baseName, { name: baseName, demoId: '', mp4Id: '', movId: '' });
      productMap.get(baseName).movId = file.id;
    });

    // 3.5. Fetch existing products to avoid duplicates
    const { getProducts } = await import('@/lib/google');
    const existingProducts = await getProducts();
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    // 4. Prepare data for Google Sheets batch append
    const rowsToAppend: any[][] = [];
    const skippedSkus: string[] = [];
    
    productMap.forEach((data, baseName) => {
      const sku = baseName.toUpperCase().replace(/\s+/g, '-');
      
      if (existingSkus.has(sku)) {
        skippedSkus.push(sku);
        return; // Bỏ qua sản phẩm đã tồn tại
      }

      const slug = baseName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      const defaultThumbnail = data.thumbnail || (data.demoId ? `https://drive.google.com/thumbnail?id=${data.demoId}&sz=w800` : '');
      
      rowsToAppend.push([
        sku,
        baseName,
        slug,
        tags.join(', '),
        defaultThumbnail,
        data.demoId,
        data.mp4Id,
        priceMp4,
        data.movId,
        priceMov,
        'Standard',
        status
      ]);
    });

    if (rowsToAppend.length === 0) {
      if (skippedSkus.length > 0) {
        return { success: false, message: `Tất cả ${skippedSkus.length} video trong thư mục đều đã tồn tại trên hệ thống (Bị trùng lặp). Không có dữ liệu mới được thêm.` };
      }
      return { success: false, message: 'Không tìm thấy video nào hợp lệ trong các thư mục con.' };
    }

    // 5. Append to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rowsToAppend
      }
    });

    revalidatePath('/admin/products');
    revalidatePath('/');
    
    let msg = `Đã nhập thành công ${rowsToAppend.length} videos!`;
    if (skippedSkus.length > 0) {
      msg += ` (Đã bỏ qua ${skippedSkus.length} video bị trùng lặp: ${skippedSkus.slice(0, 3).join(', ')}${skippedSkus.length > 3 ? '...' : ''})`;
    }
    return { success: true, count: rowsToAppend.length, message: msg };

  } catch (error: any) {
    console.error("Batch Import Error:", error);
    return { success: false, message: error.message || 'Có lỗi xảy ra khi đồng bộ.' };
  }
}
