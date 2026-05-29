"use server";

import { addProduct } from '@/lib/google';
import { uploadToDrive, uploadToYouTube } from '@/lib/upload';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitNewProduct(formData: FormData) {
  const tagsData = formData.getAll('tags') as string[];
  const tags = tagsData.length === 1 && tagsData[0].includes(',')
    ? tagsData[0].split(',').map(t => t.trim()).filter(Boolean)
    : tagsData.filter(Boolean);

  let driveGocMp4Id = formData.get('driveGocMp4Id') as string || '';
  let driveGocMovId = formData.get('driveGocMovId') as string || '';
  let driveDemoId = formData.get('driveDemoId') as string || '';
  let youtubeDemoUrl = formData.get('youtubeDemoUrl') as string || '';

  const videoFile = formData.get('videoFile') as File | null;
  const demoFile = formData.get('demoFile') as File | null;
  const uploadToYT = formData.get('uploadToYouTube') === 'on' || formData.get('uploadToYouTube') === 'true';

  const MP4_FOLDER_ID = process.env.DRIVE_MP4_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  const MOV_FOLDER_ID = process.env.DRIVE_MOV_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';

  if (videoFile && videoFile.size > 0) {
    const isMp4 = videoFile.name.toLowerCase().endsWith('.mp4');
    const folder = isMp4 ? MP4_FOLDER_ID : MOV_FOLDER_ID;
    const id = await uploadToDrive(videoFile, folder);
    if (isMp4) driveGocMp4Id = id;
    else driveGocMovId = id;
  }

  if (demoFile && demoFile.size > 0) {
    const isMp4 = demoFile.name.toLowerCase().endsWith('.mp4');
    const folder = isMp4 ? MP4_FOLDER_ID : MOV_FOLDER_ID;
    const driveId = await uploadToDrive(demoFile, folder);
    driveDemoId = driveId;

      if (uploadToYT) {
        try {
          const ytId = await uploadToYouTube(demoFile, formData.get('name') as string, formData.get('description') as string);
          if (ytId) {
            youtubeDemoUrl = `https://youtu.be/${ytId}`;
          }
        } catch (e) {
          console.error('Failed to upload demo to YouTube', e);
        }
      }
  }

  const productData = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    tags: tags,
    thumbnailUrl: formData.get('thumbnailUrl') as string,
    driveDemoId,
    youtubeDemoUrl,
    driveGocMp4Id,
    priceMp4: parseFloat(formData.get('priceMp4') as string) || 0,
    driveGocMovId,
    priceMov: parseFloat(formData.get('priceMov') as string) || 0,
    licenseType: (formData.get('licenseType') as string) || 'Standard',
    status: (formData.get('status') as 'active' | 'inactive') || 'active',
    description: (formData.get('description') as string) || '',
    resolution: (formData.get('resolution') as string) || '4K Ultra HD',
    duration: (formData.get('duration') as string) || '',
    fps: (formData.get('fps') as string) || '60 FPS',
    size: (formData.get('size') as string) || '',
    id: (formData.get('id') as string) || '',
    stt: formData.get('stt') ? parseInt(formData.get('stt') as string) : undefined,
  };

  const success = await addProduct(productData);

  if (success) {
    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    redirect('/admin/products?success=true');
  } else {
    throw new Error('Failed to save product to Google Sheets');
  }
}

export async function editProduct(formData: FormData) {
  const sku = formData.get('originalSku') as string;
  const tagsData = formData.getAll('tags') as string[];
  const tags = tagsData.length === 1 && tagsData[0].includes(',')
    ? tagsData[0].split(',').map(t => t.trim()).filter(Boolean)
    : tagsData.filter(Boolean);

  let driveGocMp4Id = formData.get('driveGocMp4Id') as string || '';
  let driveGocMovId = formData.get('driveGocMovId') as string || '';
  let driveDemoId = formData.get('driveDemoId') as string || '';
  let youtubeDemoUrl = formData.get('youtubeDemoUrl') as string || '';

  const videoFile = formData.get('videoFile') as File | null;
  const demoFile = formData.get('demoFile') as File | null;
  const uploadToYT = formData.get('uploadToYouTube') === 'on' || formData.get('uploadToYouTube') === 'true';

  const MP4_FOLDER_ID = process.env.DRIVE_MP4_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  const MOV_FOLDER_ID = process.env.DRIVE_MOV_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';

  if (videoFile && videoFile.size > 0) {
    const isMp4 = videoFile.name.toLowerCase().endsWith('.mp4');
    const folder = isMp4 ? MP4_FOLDER_ID : MOV_FOLDER_ID;
    const id = await uploadToDrive(videoFile, folder);
    if (isMp4) driveGocMp4Id = id;
    else driveGocMovId = id;
  }

  if (demoFile && demoFile.size > 0) {
    const isMp4 = demoFile.name.toLowerCase().endsWith('.mp4');
    const folder = isMp4 ? MP4_FOLDER_ID : MOV_FOLDER_ID;
    const driveId = await uploadToDrive(demoFile, folder);
    driveDemoId = driveId;

      if (uploadToYT) {
        try {
          const ytId = await uploadToYouTube(demoFile, formData.get('name') as string, formData.get('description') as string);
          if (ytId) {
            youtubeDemoUrl = `https://youtu.be/${ytId}`;
          }
        } catch (e) {
          console.error('Failed to upload demo to YouTube', e);
        }
      }
  }

  const { updateProduct } = await import('@/lib/google');
  
  const productData = {
    name: formData.get('name') as string,
    tags: tags,
    thumbnailUrl: formData.get('thumbnailUrl') as string,
    driveDemoId,
    youtubeDemoUrl,
    driveGocMp4Id,
    priceMp4: parseFloat(formData.get('priceMp4') as string) || 0,
    driveGocMovId,
    priceMov: parseFloat(formData.get('priceMov') as string) || 0,
    licenseType: (formData.get('licenseType') as string) || 'Standard',
    status: (formData.get('status') as 'active' | 'inactive') || 'active',
    description: (formData.get('description') as string) || '',
    resolution: (formData.get('resolution') as string) || '4K Ultra HD',
    duration: (formData.get('duration') as string) || '',
    fps: (formData.get('fps') as string) || '60 FPS',
    size: (formData.get('size') as string) || '',
    id: (formData.get('id') as string) || '',
    stt: formData.get('stt') ? parseInt(formData.get('stt') as string) : undefined,
  };

  const success = await updateProduct(sku, productData);

  if (success) {
    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    redirect('/admin/products?updated=true');
  } else {
    throw new Error('Failed to update product in Google Sheets');
  }
}

export async function deleteProductAction(sku: string) {
  const { deleteProduct } = await import('@/lib/google');
  const success = await deleteProduct(sku);
  if (success) {
    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    return { success: true };
  } else {
    return { success: false, message: 'Failed to delete product' };
  }
}

export async function deleteAllProductsAction(password: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, message: 'Mật khẩu quản trị không chính xác' };
  }
  
  const { deleteAllProducts } = await import('@/lib/google');
  const success = await deleteAllProducts();
  
  if (success) {
    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    return { success: true };
  } else {
    return { success: false, message: 'Xóa thất bại. Vui lòng thử lại' };
  }
}
