import { google } from 'googleapis';
import { Product, Order, Category, Coupon, Bundle, Settings } from '@/types';

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

/**
 * Lấy danh sách sản phẩm từ tab 'Products'
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A2:L', // Bỏ qua dòng tiêu đề (Header)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      sku: row[0] || '',
      name: row[1] || '',
      slug: row[2] || '',
      tags: row[3] ? row[3].split(',').map((t: string) => t.trim()) : [],
      thumbnailUrl: row[4] || '',
      driveDemoId: row[5] || '',
      driveGocMp4Id: row[6] || '',
      priceMp4: parseFloat(row[7]) || 0,
      driveGocMovId: row[8] || '',
      priceMov: parseFloat(row[9]) || 0,
      licenseType: row[10] || '',
      status: (row[11] as 'active' | 'inactive') || 'inactive',
    }));
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
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Products!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            product.sku,
            product.name,
            slug,
            product.tags.join(', '),
            product.thumbnailUrl,
            product.driveDemoId,
            product.driveGocMp4Id,
            product.priceMp4,
            product.driveGocMovId,
            product.priceMov,
            product.licenseType,
            product.status
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
      range: 'Products!A:L',
    });
    const rows = response.data.values;
    if (!rows) return false;

    const rowIndex = rows.findIndex(row => row[0] === sku);
    if (rowIndex === -1) return false;

    const rowNumber = rowIndex + 1;
    const existingRow = rows[rowIndex];

    const updatedRow = [
      sku, 
      product.name ?? existingRow[1], 
      product.slug ?? existingRow[2], 
      product.tags ? product.tags.join(', ') : existingRow[3], 
      product.thumbnailUrl ?? existingRow[4], 
      product.driveDemoId ?? existingRow[5], 
      product.driveGocMp4Id ?? existingRow[6], 
      product.priceMp4 ?? existingRow[7], 
      product.driveGocMovId ?? existingRow[8], 
      product.priceMov ?? existingRow[9], 
      product.licenseType ?? existingRow[10], 
      product.status ?? existingRow[11], 
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Products!A${rowNumber}:L${rowNumber}`,
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
      range: 'Products!A:L',
    });
    const rows = valuesRes.data.values;
    if (!rows) return false;

    const rowIndex = rows.findIndex(row => row[0] === sku);
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
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tags!A2:A',
    });
    const rows = response.data.values;
    if (!rows) return [];
    return rows.map(r => r[0] ?? '').filter(Boolean);
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
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Settings!A2:B',
    });
    const rows = response.data.values;
    if (!rows) return {};
    
    const settings: any = {};
    rows.forEach(row => {
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
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Coupons!A2:D',
    });
    const rows = response.data.values;
    if (!rows) return [];
    
    return rows.map((row) => ({
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
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tiers!A2:B',
    });
    const rows = response.data.values;
    if (!rows) return [];
    
    return rows
      .map((row) => ({
        minItems: parseInt(row[0]) || 0,
        discountPercent: parseFloat(row[1]) || 0,
      }))
      .sort((a, b) => b.minItems - a.minItems); // Sort descending to check biggest tier first
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return [];
  }
}

