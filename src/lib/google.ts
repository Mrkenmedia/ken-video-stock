import { google } from 'googleapis';
import { Product, Order, Category, Coupon, Bundle, Settings, Banner } from '@/types';
import { generateIdFromSku } from './utils';

// Xử lý xuống dòng cho Private Key trên môi trường cloud
const privateKey = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : '';

// Khởi tạo client xác thực bằng Service Account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
});

export const sheets = google.sheets({ version: 'v4', auth });
export const drive = google.drive({ version: 'v3', auth });

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// --- GLOBAL IN-MEMORY CACHE ---
// Giúp giảm tải 99% request lên Google Sheets API, chống lỗi "Quota exceeded"
const promiseCache: Record<string, { promise: Promise<any>, timestamp: number }> = {};
const CACHE_TTL_MS = 15000; // 15 seconds

async function cachedSpreadsheetGet(range: string) {
  const now = Date.now();
  if (promiseCache[range] && now - promiseCache[range].timestamp < CACHE_TTL_MS) {
    return promiseCache[range].promise;
  }
  
  const promise = sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  
  promiseCache[range] = { promise, timestamp: now };
  
  try {
    await promise;
  } catch (error) {
    delete promiseCache[range];
    throw error;
  }
  
  return promise;
}

/**
 * Lấy danh sách sản phẩm từ tab 'Products'
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const [prodResponse, settings] = await Promise.all([
      cachedSpreadsheetGet('Products!A2:S'),
      getSettings().catch(() => ({} as Partial<Settings>))
    ]);

    const rows = prodResponse.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const discountPercent = parseFloat(settings.globalDiscountPercent || '0');
    const startStr = settings.globalDiscountStart;
    const endStr = settings.globalDiscountEnd;
    
    let isDiscountActive = false;
    if (discountPercent > 0) {
      const now = new Date();
      isDiscountActive = true;
      if (startStr) {
        const start = new Date(startStr);
        if (now < start) isDiscountActive = false;
      }
      if (endStr) {
        const end = new Date(endStr);
        if (now > end) isDiscountActive = false;
      }
    }

    return rows.map((row: any[]) => {
      const skuVal = row[2] || '';
      const originalPriceMp4 = parseFloat(row[9]) || 0;
      const originalPriceMov = parseFloat(row[11]) || 0;
      
      let priceMp4 = originalPriceMp4;
      let priceMov = originalPriceMov;
      
      if (isDiscountActive) {
        priceMp4 = Math.round((originalPriceMp4 * (1 - discountPercent / 100)) / 1000) * 1000;
        priceMov = Math.round((originalPriceMov * (1 - discountPercent / 100)) / 1000) * 1000;
      }

      return {
        stt: row[0] ? parseInt(row[0]) : undefined,
        id: row[1] || generateIdFromSku(skuVal) || '',
        sku: skuVal,
        name: row[3] || '',
        slug: row[4] || '',
        tags: row[5] ? row[5].split(',').map((t: string) => t.trim()) : [],
        thumbnailUrl: row[6] || '',
        driveDemoId: row[7] || '',
        driveGocMp4Id: row[8] || '',
        priceMp4,
        driveGocMovId: row[10] || '',
        priceMov,
        originalPriceMp4: isDiscountActive && discountPercent > 0 ? originalPriceMp4 : undefined,
        originalPriceMov: isDiscountActive && discountPercent > 0 ? originalPriceMov : undefined,
        licenseType: row[12] || '',
        status: (row[13] as 'active' | 'inactive') || 'inactive',
        description: row[14] || '',
        resolution: row[15] || '4K Ultra HD',
        duration: row[16] || '',
        fps: row[17] || '60 FPS',
        size: row[18] || '',
      };
    });
  } catch (error) {
    console.error('Error fetching products from Sheets:', error);
    return [];
  }
}

/**
 * Cấp quyền Viewer cho email trên một file Google Drive
 */
export async function grantDrivePermission(fileId: string, email: string) {
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: email,
      },
      // sendNotificationEmail: false // Có thể tắt email tự động của Drive
    });
    return true;
  } catch (error) {
    console.error(`Error granting permission for ${email} on file ${fileId}:`, error);
    return false;
  }
}

/**
 * Ghi log đơn hàng mới vào Google Sheets (tab Orders)
 */
export async function createOrderLog(orderData: {
  orderId: string;
  email: string;
  sku: string;
  format: string;
  totalPrice: number;
  status: string;
  logs: string;
}) {
  try {
    const date = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:H', // Mã Đơn, Ngày, Email, SKU, Định dạng, Tổng tiền, Trạng thái, Log
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            orderData.orderId,
            date,
            orderData.email,
            orderData.sku,
            orderData.format,
            orderData.totalPrice,
            orderData.status,
            orderData.logs
          ]
        ]
      }
    });
    return true;
  } catch (error) {
    console.error('Error creating order in Sheets:', error);
    return false;
  }
}

/**
 * Thêm sản phẩm mới vào Google Sheets (tab Products)
 */
export async function addProduct(product: Omit<Product, 'slug'> & { slug?: string }) {
  try {
    // Tự động tạo slug nếu chưa có
    const slug = product.slug || product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const sheetsData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:S',
    });
    const existingRows = sheetsData.data.values || [];
    const nextRow = Math.max(existingRows.length + 1, 2);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Products!A${nextRow}:S${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            product.stt || '',                               // Col A: stt
            product.id || generateIdFromSku(product.sku),   // Col B: id
            product.sku,                                    // Col C: sku
            product.name,                                   // Col D: name
            slug,                                           // Col E: slug
            product.tags.join(', '),                        // Col F: tags
            product.thumbnailUrl,                           // Col G: thumbnailUrl
            product.driveDemoId,                            // Col H: driveDemoId
            product.driveGocMp4Id,                          // Col I: driveGocMp4Id
            product.priceMp4,                               // Col J: priceMp4
            product.driveGocMovId,                          // Col K: driveGocMovId
            product.priceMov,                               // Col L: priceMov
            product.licenseType,                            // Col M: licenseType
            product.status,                                 // Col N: status
            product.description || '',                      // Col O: description
            product.resolution || '4K Ultra HD',            // Col P: resolution
            product.duration || '',                         // Col Q: duration
            product.fps || '60 FPS',                        // Col R: fps
            product.size || '',                             // Col S: size
          ]
        ]
      }
    });
    return true;
  } catch (error) {
    console.error('Error adding product to Sheets:', error);
    return false;
  }
}

/**
 * Cập nhật sản phẩm trong Google Sheets (tab Products) dựa vào SKU
 */
export async function updateProduct(sku: string, product: Partial<Product>) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:S',
    });
    const rows = response.data.values;
    if (!rows) return false;

    const rowIndex = rows.findIndex(row => row[2] === sku);
    if (rowIndex === -1) return false;

    const rowNumber = rowIndex + 1;
    const existingRow = rows[rowIndex];

    const updatedRow = [
      product.stt ?? existingRow[0] ?? '',                             // Col A: stt
      product.id ?? (existingRow[1] || generateIdFromSku(sku)),        // Col B: id
      sku,                                                            // Col C: sku
      product.name ?? existingRow[3],                                 // Col D: name
      product.slug ?? existingRow[4],                                 // Col E: slug
      product.tags ? product.tags.join(', ') : existingRow[5],        // Col F: tags
      product.thumbnailUrl ?? existingRow[6],                         // Col G: thumbnailUrl
      product.driveDemoId ?? existingRow[7],                          // Col H: driveDemoId
      product.driveGocMp4Id ?? existingRow[8],                        // Col I: driveGocMp4Id
      product.priceMp4 ?? existingRow[9],                             // Col J: priceMp4
      product.driveGocMovId ?? existingRow[10],                       // Col K: driveGocMovId
      product.priceMov ?? existingRow[11],                            // Col L: priceMov
      product.licenseType ?? existingRow[12],                         // Col M: licenseType
      product.status ?? existingRow[13],                              // Col N: status
      product.description ?? existingRow[14] ?? '',                   // Col O: description
      product.resolution ?? existingRow[15] ?? '4K Ultra HD',         // Col P: resolution
      product.duration ?? existingRow[16] ?? '',                      // Col Q: duration
      product.fps ?? existingRow[17] ?? '60 FPS',                     // Col R: fps
      product.size ?? existingRow[18] ?? '',                          // Col S: size
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Products!A${rowNumber}:S${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] }
    });
    return true;
  } catch (error) {
    console.error(`Error updating product ${sku}:`, error);
    return false;
  }
}

/**
 * Xóa sản phẩm khỏi Google Sheets (tab Products) dựa vào SKU
 */
export async function deleteProduct(sku: string) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });
    
    const sheet = response.data.sheets?.find(s => s.properties?.title === 'Products');
    if (!sheet) return false;
    const sheetId = sheet.properties?.sheetId;

    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:S',
    });
    const rows = valuesRes.data.values;
    if (!rows) return false;

    const rowIndex = rows.findIndex(row => row[2] === sku);
    if (rowIndex === -1) return false;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    });
    return true;
  } catch (error) {
    console.error(`Error deleting product ${sku}:`, error);
    return false;
  }
}
// ---------- TAG MANAGEMENT (Google Sheet Tab 'Tags') ----------

/**
 * Ensure the 'Tags' sheet exists; create it if missing.
 */
export async function ensureTagsSheet(): Promise<void> {
  try {
    const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetsInfo = ss.data.sheets || [];
    const tagsSheet = sheetsInfo.find(s => s.properties?.title === 'Tags');
    if (!tagsSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Tags',
                },
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring Tags sheet exists:', error);
  }
}
/**
 * Lấy danh sách các tag từ tab 'Tags'.
 */
export async function getTags(): Promise<string[]> {
  try {
    const response = await cachedSpreadsheetGet('Tags!A2:A');
    const rows = response.data.values;
    if (!rows) return [];
    return rows.map((r: any[]) => r[0] ?? '').filter(Boolean);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Thêm tag mới.
 */
export async function addTag(tag: string): Promise<boolean> {
  if (!tag) return false;
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tags!A:A',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[tag]] },
    });
    return true;
  } catch (error) {
    console.error('Error adding tag:', error);
    return false;
  }
}

/**
 * Cập nhật tag.
 */
export async function updateTag(oldTag: string, newTag: string): Promise<boolean> {
  if (!oldTag || !newTag) return false;
  try {
    const all = await getTags();
    const index = all.findIndex(t => t === oldTag);
    if (index === -1) return false;
    const rowNumber = index + 2; // +2 vì tiêu đề ở A1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Tags!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newTag]] },
    });
    return true;
  } catch (error) {
    console.error('Error updating tag:', error);
    return false;
  }
}

/**
 * Xóa tag.
 */
export async function deleteTag(tag: string): Promise<boolean> {
  if (!tag) return false;
  try {
    const all = await getTags();
    const index = all.findIndex(t => t === tag);
    if (index === -1) return false;
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });
    const sheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'Tags');
    if (!sheet) return false;
    const sheetId = sheet.properties?.sheetId;
    const rowIndex = index + 1; // zero‑based for deleteDimension startIndex (skip header)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error('Error deleting tag:', error);
    return false;
  }
}
// ---------- SETTINGS MANAGEMENT (Google Sheet Tab 'Settings') ----------

export async function ensureSettingsSheet(): Promise<void> {
  try {
    const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetsInfo = ss.data.sheets || [];
    const settingsSheet = sheetsInfo.find(s => s.properties?.title === 'Settings');
    if (!settingsSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Settings',
                },
              },
            },
          ],
        },
      });
      // Add default headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Settings!A1:B1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Key', 'Value']] },
      });
    }
  } catch (error) {
    console.error('Error ensuring Settings sheet exists:', error);
  }
}

export async function getSettings(): Promise<Partial<Settings>> {
  try {
    const response = await cachedSpreadsheetGet('Settings!A2:B');
    const rows = response.data.values;
    if (!rows) return {};
    
    const settings: any = {};
    rows.forEach((row: any[]) => {
      if (row[0]) settings[row[0]] = row[1] || '';
    });
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

export async function updateSetting(key: string, value: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Settings!A:B',
    });
    const rows = response.data.values || [];
    const index = rows.findIndex(r => r[0] === key);
    
    if (index === -1) {
      // Append if not exists
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Settings!A:B',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[key, value]] },
      });
    } else {
      // Update if exists
      const rowNumber = index + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Settings!A${rowNumber}:B${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[key, value]] },
      });
    }
    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
}
// ---------- COUPON MANAGEMENT (Google Sheet Tab 'Coupons') ----------

export async function ensureCouponsSheet(): Promise<void> {
  try {
    const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetsInfo = ss.data.sheets || [];
    const couponsSheet = sheetsInfo.find(s => s.properties?.title === 'Coupons');
    if (!couponsSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Coupons',
                },
              },
            },
          ],
        },
      });
      // Add default headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Coupons!A1:D1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Code', 'Type', 'DiscountValue', 'Condition']] },
      });
    }
  } catch (error) {
    console.error('Error ensuring Coupons sheet exists:', error);
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const response = await cachedSpreadsheetGet('Coupons!A2:D');
    const rows = response.data.values;
    if (!rows) return [];
    
    return rows.map((row: any[]) => ({
      code: row[0] || '',
      type: (row[1] as 'global' | 'exclusive') || 'global',
      discountValue: parseFloat(row[2]) || 0,
      condition: row[3] || '',
    }));
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

export async function addCoupon(coupon: Coupon): Promise<boolean> {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Coupons!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[coupon.code.toUpperCase(), coupon.type, coupon.discountValue, coupon.condition || '']] },
    });
    return true;
  } catch (error) {
    console.error('Error adding coupon:', error);
    return false;
  }
}

export async function updateCoupon(oldCode: string, coupon: Coupon): Promise<boolean> {
  try {
    const all = await getCoupons();
    const index = all.findIndex(c => c.code.toUpperCase() === oldCode.toUpperCase());
    if (index === -1) return false;
    const rowNumber = index + 2; // +2 vì tiêu đề ở A1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Coupons!A${rowNumber}:D${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[coupon.code.toUpperCase(), coupon.type, coupon.discountValue, coupon.condition || '']] },
    });
    return true;
  } catch (error) {
    console.error('Error updating coupon:', error);
    return false;
  }
}

export async function deleteCoupon(code: string): Promise<boolean> {
  try {
    const all = await getCoupons();
    const index = all.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
    if (index === -1) return false;
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });
    const sheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'Coupons');
    if (!sheet) return false;
    const sheetId = sheet.properties?.sheetId;
    const rowIndex = index + 1; // zero-based skip header
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return false;
  }
}

// ---------- TIER PRICING MANAGEMENT (Google Sheet Tab 'Tiers') ----------

export async function ensureTiersSheet(): Promise<void> {
  try {
    const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetsInfo = ss.data.sheets || [];
    const tiersSheet = sheetsInfo.find(s => s.properties?.title === 'Tiers');
    if (!tiersSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Tiers',
                },
              },
            },
          ],
        },
      });
      // Add default headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Tiers!A1:B1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['MinItems', 'DiscountPercent']] },
      });
      // Add some sample tiers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Tiers!A2:B',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [
          ['5', '20'],
          ['10', '30']
        ] },
      });
    }
  } catch (error) {
    console.error('Error ensuring Tiers sheet exists:', error);
  }
}

export async function getTiers(): Promise<{ minItems: number; discountPercent: number }[]> {
  try {
    const response = await cachedSpreadsheetGet('Tiers!A2:B');
    const rows = response.data.values;
    if (!rows) return [];
    
    return rows
      .map((row: any[]) => ({
        minItems: parseInt(row[0]) || 0,
        discountPercent: parseFloat(row[1]) || 0,
      }))
      .sort((a: any, b: any) => b.minItems - a.minItems); // Sort descending to check biggest tier first
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return [];
  }
}

/**
 * Lấy lịch sử mua hàng của một email
 */
export async function getOrdersByEmail(email: string) {
  try {
    const response = await cachedSpreadsheetGet('Orders!A2:H');
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Filter by exact email match (case-insensitive)
    const userOrders = rows.filter((row: any[]) => row[2] && row[2].toLowerCase() === email.toLowerCase());
    
    return userOrders.map((row: any[]) => ({
      orderId: row[0] || '',
      date: row[1] || '',
      email: row[2] || '',
      itemsStr: row[3] || '', // SKU1(MP4), SKU2(MOV)
      format: row[4] || '',
      totalPrice: parseFloat(row[5]) || 0,
      status: row[6] || 'pending',
      logs: row[7] || '',
    }));
  } catch (error) {
    console.error('Error fetching orders by email from Sheets:', error);
    return [];
  }
}

// ---------- BANNERS MANAGEMENT (Google Sheet Tab 'Banners') ----------

export async function ensureBannersSheet(): Promise<void> {
  try {
    const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetsInfo = ss.data.sheets || [];
    const bannersSheet = sheetsInfo.find(s => s.properties?.title === 'Banners');
    if (!bannersSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Banners',
                },
              },
            },
          ],
        },
      });
      // Add default headers: ID, Title, Subtitle, MediaType, MediaUrl, LinkUrl, Order
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Banners!A1:G1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { 
          values: [['ID', 'Title', 'Subtitle', 'MediaType', 'MediaUrl', 'LinkUrl', 'Order']] 
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring Banners sheet exists:', error);
  }
}

export async function getBanners(): Promise<Banner[]> {
  try {
    await ensureBannersSheet();
    const response = await cachedSpreadsheetGet('Banners!A2:G');
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    return rows
      .map((row: any[]) => ({
        id: row[0] || '',
        title: row[1] || '',
        subtitle: row[2] || '',
        mediaType: (row[3] as 'image' | 'video') || 'image',
        mediaUrl: row[4] || '',
        linkUrl: row[5] || '',
        order: parseInt(row[6]) || 0,
      }))
      .filter(b => b.id)
      .sort((a: any, b: any) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

export async function addBanner(banner: Omit<Banner, 'id'>): Promise<boolean> {
  try {
    await ensureBannersSheet();
    const id = 'b_' + Math.random().toString(36).substring(2, 11);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Banners!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          id,
          banner.title || '',
          banner.subtitle || '',
          banner.mediaType,
          banner.mediaUrl,
          banner.linkUrl || '',
          banner.order,
        ]],
      },
    });
    return true;
  } catch (error) {
    console.error('Error adding banner:', error);
    return false;
  }
}

export async function updateBanner(id: string, banner: Partial<Banner>): Promise<boolean> {
  try {
    await ensureBannersSheet();
    const banners = await getBanners();
    const index = banners.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    const rowIndex = index + 2; // 1-based, +1 for header
    
    // Fetch the current row first to merge values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Banners!A${rowIndex}:G${rowIndex}`,
    });
    const row = response.data.values?.[0] || [];
    
    const updatedRow = [
      id,
      banner.title !== undefined ? banner.title : (row[1] || ''),
      banner.subtitle !== undefined ? banner.subtitle : (row[2] || ''),
      banner.mediaType !== undefined ? banner.mediaType : (row[3] || 'image'),
      banner.mediaUrl !== undefined ? banner.mediaUrl : (row[4] || ''),
      banner.linkUrl !== undefined ? banner.linkUrl : (row[5] || ''),
      banner.order !== undefined ? banner.order : (row[6] || 0),
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Banners!A${rowIndex}:G${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });
    return true;
  } catch (error) {
    console.error('Error updating banner:', error);
    return false;
  }
}

export async function deleteBanner(id: string): Promise<boolean> {
  try {
    await ensureBannersSheet();
    const banners = await getBanners();
    const index = banners.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });
    const sheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'Banners');
    if (!sheet) return false;
    
    const sheetId = sheet.properties?.sheetId;
    const rowIndex = index + 1; // 0-based for deleteDimension, skipping header (index 0 is header row)
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error('Error deleting banner:', error);
    return false;
  }
}

