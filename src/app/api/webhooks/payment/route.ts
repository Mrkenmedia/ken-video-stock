import { NextResponse } from 'next/server';
import { getProducts, grantDrivePermission, createOrderLog, sheets, SPREADSHEET_ID, getSettings } from '@/lib/google';
import { sendTelegramNotification } from '@/lib/telegram';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // ✅ BƯỚC 1: Xác thực Secret Key trước khi xử lý bất cứ thứ gì
    // SePay gửi token qua header "apikey", Casso gửi qua "secure-token"
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;
    
    if (webhookSecret && webhookSecret !== 'your_sepay_secret_here') {
      const headerApiKey = request.headers.get('apikey') 
        || request.headers.get('secure-token')
        || request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (headerApiKey !== webhookSecret) {
        console.warn('⚠️ Webhook: Unauthorized request - Invalid secret key');
        return NextResponse.json(
          { success: false, message: 'Unauthorized' }, 
          { status: 401 }
        );
      }
    }

    // 1. Lấy dữ liệu Webhook từ SePay / Casso
    const payload = await request.json();
    console.log('Webhook payload received:', payload);

    // Xác thực secret key (Ví dụ với header hoặc payload)
    // Tùy thuộc vào SePay hay Casso mà cấu trúc sẽ khác nhau, ở đây giả lập SePay
    const content = payload.content || payload.description || '';
    const amount = payload.transferAmount || payload.amount || 0;

    if (!content) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // 2. Tìm Mã Đơn Hàng trong nội dung chuyển khoản
    // Giả sử mã đơn hàng bắt đầu bằng "DH" (ví dụ: "DH1234")
    const orderMatch = content.match(/DH\d+/i);
    if (!orderMatch) {
      return NextResponse.json({ success: true, message: 'Không tìm thấy mã đơn hàng trong nội dung' });
    }
    const orderId = orderMatch[0].toUpperCase();

    // 3. Đọc dữ liệu Đơn Hàng từ Google Sheets để lấy Email và SKU
    const orderRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:H', // Mã Đơn, Ngày, Email, SKU, Định dạng, Tổng tiền, Trạng thái, Log
    });
    
    const rows = orderRes.data.values || [];
    // Tìm dòng chứa orderId (dòng 0 là header)
    const orderRowIndex = rows.findIndex((row) => row[0] === orderId);
    
    if (orderRowIndex === -1) {
      await sendTelegramNotification(`⚠️ <b>Cảnh báo</b>: Nhận được tiền (${amount}đ) cho đơn hàng <b>${orderId}</b> nhưng không tìm thấy đơn này trên Sheets.`);
      return NextResponse.json({ success: true, message: 'Không tìm thấy đơn hàng' });
    }

    const order = rows[orderRowIndex];
    const customerEmail = order[2];
    const itemsStr = order[3]; // "SKU1(MP4), SKU2(MOV)"
    const expectedAmount = parseFloat(order[5]);
    const currentStatus = order[6];

    if (currentStatus === 'completed') {
      return NextResponse.json({ success: true, message: 'Đơn hàng đã được xử lý trước đó' });
    }

    if (amount < expectedAmount) {
      await sendTelegramNotification(`⚠️ <b>Thiếu tiền</b>: Khách thanh toán đơn <b>${orderId}</b> nhưng số tiền gửi (${amount}đ) nhỏ hơn giá trị đơn (${expectedAmount}đ).`);
      return NextResponse.json({ success: true, message: 'Thanh toán không đủ' });
    }

    // 4. Phân tách danh sách SKU và cấp quyền từng file
    const itemList = itemsStr.split(',').map((s: string) => {
      const match = s.trim().match(/(.+)\((.+)\)/);
      if (match) return { sku: match[1], format: match[2] };
      return { sku: s.trim(), format: 'MP4' };
    });

    const products = await getProducts();
    const results: { name: string; sku: string; success: boolean; link?: string }[] = [];

    for (const item of itemList) {
      const product = products.find(p => p.sku === item.sku);
      if (!product) {
        results.push({ name: 'Không xác định', sku: item.sku, success: false });
        continue;
      }

      const fileId = item.format.toUpperCase() === 'MOV' ? product.driveGocMovId : product.driveGocMp4Id;
      if (!fileId) {
        results.push({ name: product.name, sku: item.sku, success: false });
        continue;
      }

      const success = await grantDrivePermission(fileId, customerEmail);
      results.push({ 
        name: product.name, 
        sku: item.sku, 
        success, 
        link: `https://drive.google.com/file/d/${fileId}/view` 
      });
    }

    // 5. Cập nhật Trạng thái đơn hàng trên Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!G${orderRowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['completed']] }
    });

    // 6. Gửi thông báo Telegram
    const successItems = results.filter(r => r.success);
    const failItems = results.filter(r => !r.success);

    let telegramMsg = `✅ <b>Thanh toán thành công</b>: Đơn hàng <b>${orderId}</b>\n` +
                      `- Khách hàng: ${customerEmail}\n` +
                      `- Tổng tiền: ${amount}đ\n` +
                      `- Danh sách file (${successItems.length}):\n`;
    
    successItems.forEach(r => { telegramMsg += `  + ${r.name} (${r.sku})\n`; });
    if (failItems.length > 0) {
      telegramMsg += `\n⚠️ <b>Lỗi cấp quyền (${failItems.length} file)</b>:\n`;
      failItems.forEach(r => { telegramMsg += `  - ${r.name} (${r.sku})\n`; });
    }

    await sendTelegramNotification(telegramMsg);

    // 7. Gửi Email thông báo cho khách hàng
    const settings = await getSettings();
    const emailHtmlRaw = settings.emailTemplate || `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0891b2;">Cảm ơn bạn đã mua hàng tại KenVideo!</h2>
        <p>Đơn hàng <b>{{order_id}}</b> của bạn đã được xử lý thành công.</p>
        <p>Bạn đã có quyền truy cập vào các file sau bằng email <b>{{customer_email}}</b>:</p>
        <ul style="padding-left: 20px;">
          {{product_list}}
        </ul>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">Nếu gặp khó khăn trong việc tải file, hãy liên hệ với chúng tôi qua Telegram.</p>
      </div>
    `;

    let productListHtml = '';
    results.forEach(r => {
      if (r.success) {
        productListHtml += `<li style="margin-bottom: 12px; list-style-type: none; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <strong style="color: #0f172a; font-size: 14px;">${r.name}</strong> <span style="font-size: 11px; color: #64748b; font-family: monospace;">(${r.sku})</span><br/>
          <a href="${r.link}" target="_blank" style="display: inline-block; margin-top: 6px; color: #0891b2; text-decoration: none; font-weight: bold; font-size: 13px;">Truy cập Tải File (Google Drive) &rarr;</a>
        </li>`;
      }
    });

    let finalEmailHtml = emailHtmlRaw;

    if (finalEmailHtml.includes('{{product_list}}')) {
      finalEmailHtml = finalEmailHtml
        .replace(/{{order_id}}/g, orderId)
        .replace(/{{customer_email}}/g, customerEmail)
        .replace(/{{product_list}}/g, `<ul style="padding: 0; margin: 0;">${productListHtml}</ul>`);
    } else {
      // Fallback cho template cũ không có {{product_list}}
      const productNames = results.filter(r => r.success).map(r => `• ${r.name} (${r.sku})`).join('<br/>');
      const firstLink = results.find(r => r.success)?.link || '#';

      // Tự động dựng danh sách đầy đủ đẹp mắt
      let fullLinksList = `<div style="margin-top: 15px; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: #0f172a; font-size: 14px;">Danh sách Video bản quyền trong đơn hàng của bạn:</p>
        <ul style="padding: 0; margin: 0;">${productListHtml}</ul>
      </div>`;

      finalEmailHtml = finalEmailHtml
        .replace(/{{order_id}}/g, orderId)
        .replace(/{{customer_email}}/g, customerEmail)
        .replace(/{{product_name}}/g, productNames)
        .replace(/{{sku}}/g, results.filter(r => r.success).map(r => r.sku).join(', '))
        .replace(/{{drive_link}}/g, firstLink)
        + `<br/>${fullLinksList}`;
    }

    await sendEmail({
      to: customerEmail,
      subject: `[KenVideo] Đơn hàng ${orderId} đã hoàn tất - Link tải Video của bạn`,
      html: finalEmailHtml,
    });

    console.log(`[Webhook] Đã gửi email cho ${customerEmail}`);

    return NextResponse.json({ success: true, message: 'Xử lý đơn hàng thành công' });

    return NextResponse.json({ success: true, message: 'Xử lý đơn hàng thành công' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
