"use server";

import { drive, sheets, SPREADSHEET_ID } from '@/lib/google';
import { revalidatePath } from 'next/cache';
import { generateIdFromSku } from '@/lib/utils';

// Helper to format bytes to Vietnamese locale format (e.g. 43,6 MB)
function formatBytes(bytesStr: string | null | undefined) {
  if (!bytesStr) return '';
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes) || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  const dec = val >= 10 ? 1 : 2;
  let res = val.toFixed(dec).replace('.', ',');
  if (res.endsWith(',0')) res = res.substring(0, res.length - 2);
  if (res.endsWith(',00')) res = res.substring(0, res.length - 3);
  return `${res} ${sizes[i]}`;
}

// Helper to format duration in milliseconds to MM:SS or HH:MM:SS
function formatDuration(durationMillisStr: string | null | undefined) {
  if (!durationMillisStr) return '';
  const millis = parseInt(durationMillisStr, 10);
  if (isNaN(millis) || millis <= 0) return '';
  const totalSeconds = Math.round(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (num: number) => String(num).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Helper to format resolution to dot-separated format (e.g. 4.096 x 1.152)
function formatResolution(widthStr: string | number | null | undefined, heightStr: string | number | null | undefined) {
  if (!widthStr || !heightStr) return '';
  const width = typeof widthStr === 'string' ? parseInt(widthStr, 10) : widthStr;
  const height = typeof heightStr === 'string' ? parseInt(heightStr, 10) : heightStr;
  if (isNaN(width) || isNaN(height)) return '';
  const formatNum = (num: number) => new Intl.NumberFormat('vi-VN').format(num);
  return `${formatNum(width)} x ${formatNum(height)}`;
}

// Helper to format frame rate (e.g. 60 FPS)
function formatFps(frameRateStr: string | number | null | undefined) {
  if (!frameRateStr) return '60 FPS';
  const frameRate = typeof frameRateStr === 'string' ? parseFloat(frameRateStr) : frameRateStr;
  if (isNaN(frameRate)) return '60 FPS';
  return `${Math.round(frameRate)} FPS`;
}

// Helper to extract Drive Folder ID from URL
function extractFolderId(url: string) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url; // Fallback to raw string if it's already an ID
}

// Helper to fetch all files in a folder handling Google Drive API pagination limit (100 files)
async function fetchAllFilesInFolder(subFolderId: string, fileFields: string): Promise<any[]> {
  let allFiles: any[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const response: any = await drive.files.list({
      q: `'${subFolderId}' in parents and trashed = false`,
      fields: `nextPageToken, ${fileFields}`,
      pageSize: 1000,
      pageToken: pageToken,
    });
    const files = response.data.files || [];
    allFiles = allFiles.concat(files);
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);
  return allFiles;
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

    // 2. Fetch files from all 3 folders in parallel (with full pagination and video metadata fields)
    const [demoFiles, mp4Files, movFiles] = await Promise.all([
      demoFolder && demoFolder.id ? fetchAllFilesInFolder(demoFolder.id, 'files(id, name, thumbnailLink)') : Promise.resolve([]),
      mp4Folder && mp4Folder.id ? fetchAllFilesInFolder(mp4Folder.id, 'files(id, name, size, videoMediaMetadata)') : Promise.resolve([]),
      movFolder && movFolder.id ? fetchAllFilesInFolder(movFolder.id, 'files(id, name, size, videoMediaMetadata)') : Promise.resolve([])
    ]);

    // 3. Group files by base name and collect metadata
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
      if (!productMap.has(baseName)) {
        productMap.set(baseName, { name: baseName, demoId: '', mp4Id: '', movId: '', thumbnail: '', resolution: '', duration: '', fps: '', size: '' });
      }
      productMap.get(baseName).demoId = file.id;
      // Get the largest thumbnail possible, replace =s220 with =s800
      let thumb = file.thumbnailLink || '';
      if (thumb) thumb = thumb.replace('=s220', '=s800');
      productMap.get(baseName).thumbnail = thumb;
    });

    // Process MP4s
    mp4Files.forEach(file => {
      const baseName = getBaseName(file.name || '');
      if (!productMap.has(baseName)) {
        productMap.set(baseName, { name: baseName, demoId: '', mp4Id: '', movId: '', thumbnail: '', resolution: '', duration: '', fps: '', size: '' });
      }
      const entry = productMap.get(baseName);
      entry.mp4Id = file.id;

      // Auto-extract metadata from Google Drive video metadata
      if (file.videoMediaMetadata) {
        if (!entry.resolution) entry.resolution = formatResolution(file.videoMediaMetadata.width, file.videoMediaMetadata.height);
        if (!entry.duration) entry.duration = formatDuration(file.videoMediaMetadata.durationMillis);
        if (!entry.fps) entry.fps = formatFps(file.videoMediaMetadata.frameRate);
      }
      if (file.size && !entry.size) {
        entry.size = formatBytes(file.size);
      }
    });

    // Process MOVs
    movFiles.forEach(file => {
      const baseName = getBaseName(file.name || '');
      if (!productMap.has(baseName)) {
        productMap.set(baseName, { name: baseName, demoId: '', mp4Id: '', movId: '', thumbnail: '', resolution: '', duration: '', fps: '', size: '' });
      }
      const entry = productMap.get(baseName);
      entry.movId = file.id;

      // Auto-extract metadata (fallback if not already filled by MP4)
      if (file.videoMediaMetadata) {
        if (!entry.resolution) entry.resolution = formatResolution(file.videoMediaMetadata.width, file.videoMediaMetadata.height);
        if (!entry.duration) entry.duration = formatDuration(file.videoMediaMetadata.durationMillis);
        if (!entry.fps) entry.fps = formatFps(file.videoMediaMetadata.frameRate);
      }
      if (file.size && !entry.size) {
        entry.size = formatBytes(file.size);
      }
    });

    // 3.5. Fetch existing products to avoid duplicates
    const { getProducts } = await import('@/lib/google');
    const existingProducts = await getProducts();
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    // 4. Prepare data for Google Sheets batch append (A to S - 19 Columns)
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
      const customId = generateIdFromSku(sku); // Tự động sinh ID chuyên nghiệp

      rowsToAppend.push([
        '',                    // Col A: stt (Số thứ tự - để trống)
        customId,              // Col B: id (Mã ID tự sinh)
        sku,                   // Col C: sku
        baseName,              // Col D: name
        slug,                  // Col E: slug
        tags.join(', '),       // Col F: tags
        defaultThumbnail,      // Col G: thumbnailUrl
        data.demoId,           // Col H: driveDemoId
        data.mp4Id,            // Col I: driveGocMp4Id
        priceMp4,              // Col J: priceMp4
        data.movId,            // Col K: driveGocMovId
        priceMov,              // Col L: priceMov
        'Standard',            // Col M: licenseType
        status,                // Col N: status
        '',                    // Col O: description
        data.resolution || '', // Col P: resolution (Độ phân giải tự động)
        data.duration || '',   // Col Q: duration (Thời lượng tự động)
        data.fps || '',        // Col R: fps (Khung hình tự động)
        data.size || '',       // Col S: size (Dung lượng tự động)
      ]);
    });

    if (rowsToAppend.length === 0) {
      if (skippedSkus.length > 0) {
        return { success: false, message: `Tất cả ${skippedSkus.length} video trong thư mục đều đã tồn tại trên hệ thống (Bị trùng lặp). Không có dữ liệu mới được thêm.` };
      }
      return { success: false, message: 'Không tìm thấy video nào hợp lệ trong các thư mục con.' };
    }

    // 5. Write to Google Sheets at the exact next row (Mở rộng từ A:L lên A:S)
    const sheetsData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:S',
    });
    const existingRows = sheetsData.data.values || [];
    const nextRow = Math.max(existingRows.length + 1, 2);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Products!A${nextRow}:S${nextRow + rowsToAppend.length - 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rowsToAppend
      }
    });

    const { clearProductsCache } = await import('@/lib/google');
    clearProductsCache();

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
