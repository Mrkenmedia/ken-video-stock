"use server";

import { addProduct } from '@/lib/google';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitNewProduct(formData: FormData) {
  const tagsData = formData.getAll('tags') as string[];
  const tags = tagsData.length === 1 && tagsData[0].includes(',')
    ? tagsData[0].split(',').map(t => t.trim()).filter(Boolean)
    : tagsData.filter(Boolean);

  const productData = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    tags: tags,
    thumbnailUrl: formData.get('thumbnailUrl') as string,
    driveDemoId: formData.get('driveDemoId') as string,
    driveGocMp4Id: formData.get('driveGocMp4Id') as string,
    priceMp4: parseFloat(formData.get('priceMp4') as string) || 0,
    driveGocMovId: (formData.get('driveGocMovId') as string) || '',
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
    revalidatePath('/');
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

  const { updateProduct } = await import('@/lib/google');
  
  const productData = {
    name: formData.get('name') as string,
    tags: tags,
    thumbnailUrl: formData.get('thumbnailUrl') as string,
    driveDemoId: formData.get('driveDemoId') as string,
    driveGocMp4Id: formData.get('driveGocMp4Id') as string,
    priceMp4: parseFloat(formData.get('priceMp4') as string) || 0,
    driveGocMovId: (formData.get('driveGocMovId') as string) || '',
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
    revalidatePath('/');
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
    revalidatePath('/');
    return { success: true };
  } else {
    return { success: false, message: 'Failed to delete product' };
  }
}
