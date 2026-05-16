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

    const sku = orderRow[3];
    const format = orderRow[4]; // MP4 or MOV

    // 2. Tìm sản phẩm để lấy Drive File ID
    const products = await getProducts();
    const product = products.find((p) => p.sku === sku);

    if (!product) {
      return NextResponse.json({ error: `Không tìm thấy sản phẩm SKU: ${sku}` }, { status: 404 });
    }

    const fileIdToGrant =
      format?.toUpperCase() === 'MOV' ? product.driveGocMovId : product.driveGocMp4Id;

    if (!fileIdToGrant) {
      return NextResponse.json(
        { error: `Sản phẩm ${sku} thiếu File Gốc (${format}) trên Drive` },
        { status: 400 }
      );
    }

    // 3. Cấp quyền cho từng email
    const results: { email: string; success: boolean }[] = [];
    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email) continue;
      const ok = await grantDrivePermission(fileIdToGrant, email);
      results.push({ email, success: ok });
    }

    const successEmails = results.filter((r) => r.success).map((r) => r.email);
    const failEmails = results.filter((r) => !r.success).map((r) => r.email);

    // 4. Ghi log vào cột H của đơn hàng đó
    const rowIndex = rows.findIndex((r) => r[0] === orderId);
    const currentLog = orderRow[7] || '';
    const newLog = `${currentLog}\n[${new Date().toLocaleString('vi-VN')}] Admin cấp lại file cho: ${successEmails.join(', ')}${failEmails.length ? ` | Lỗi: ${failEmails.join(', ')}` : ''}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!H${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newLog]] },
    });

    // 5. Báo Telegram
    const msg =
      `🔄 <b>Cấp lại File</b> cho đơn <b>${orderId}</b>\n` +
      `- SKU: ${sku} (${format})\n` +
      `- ✅ Thành công: ${successEmails.join(', ') || 'Không có'}\n` +
      (failEmails.length ? `- ❌ Thất bại: ${failEmails.join(', ')}` : '');
    await sendTelegramNotification(msg);

    return NextResponse.json({
      success: true,
      results,
      message: `Đã xử lý ${results.length} email. Thành công: ${successEmails.length}, Thất bại: ${failEmails.length}`,
    });
  } catch (error) {
    console.error('Regrant error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi cấp lại quyền' }, { status: 500 });
  }
}
