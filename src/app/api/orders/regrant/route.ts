import { NextResponse } from 'next/server';
import { getProducts, grantDrivePermission, sheets, SPREADSHEET_ID } from '@/lib/google';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, emails } = body as { orderId: string; emails: string[] };

    if (!orderId || !emails || emails.length === 0) {
      return NextResponse.json({ error: 'Thiếu orderId hoặc danh sách email' }, { status: 400 });
    }

    // 1. Tra cứu đơn hàng từ Google Sheets
    const orderRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:H',
    });
    const rows = orderRes.data.values || [];
    const orderRow = rows.find((r) => r[0] === orderId);

    if (!orderRow) {
      return NextResponse.json({ error: `Không tìm thấy đơn hàng ${orderId}` }, { status: 404 });
    }

    const itemsStr = orderRow[3]; // "SKU1(MP4), SKU2(MOV)"
    const itemList = itemsStr.split(',').map((s: string) => {
      const match = s.trim().match(/(.+)\((.+)\)/);
      if (match) return { sku: match[1], format: match[2] };
      return { sku: s.trim(), format: 'MP4' };
    });

    const products = await getProducts();
    const results: { email: string; sku: string; success: boolean }[] = [];

    // 3. Cấp quyền cho từng email và từng sản phẩm
    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email) continue;

      for (const item of itemList) {
        const product = products.find(p => p.sku === item.sku);
        if (!product) continue;

        const fileId = item.format.toUpperCase() === 'MOV' ? product.driveGocMovId : product.driveGocMp4Id;
        if (!fileId) continue;

        const ok = await grantDrivePermission(fileId, email);
        results.push({ email, sku: item.sku, success: ok });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    // 4. Ghi log vào cột H của đơn hàng đó
    const rowIndex = rows.findIndex((r) => r[0] === orderId);
    const currentLog = orderRow[7] || '';
    const newLog = `${currentLog}\n[${new Date().toLocaleString('vi-VN')}] Admin cấp lại file cho: ${emails.join(', ')} (${successCount} file thành công)`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!H${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newLog]] },
    });

    // 5. Báo Telegram
    const msg =
      `🔄 <b>Admin Cấp lại File</b> cho đơn <b>${orderId}</b>\n` +
      `- Danh sách email: ${emails.join(', ')}\n` +
      `- Tổng số file xử lý: ${results.length}\n` +
      `- ✅ Thành công: ${successCount}\n` +
      (failCount > 0 ? `- ❌ Thất bại: ${failCount}` : '');
    await sendTelegramNotification(msg);

    return NextResponse.json({
      success: true,
      results,
      message: `Đã xử lý ${results.length} email. Thành công: ${successCount}, Thất bại: ${failCount}`,
    });
  } catch (error) {
    console.error('Regrant error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi cấp lại quyền' }, { status: 500 });
  }
}
