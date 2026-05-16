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
      await sendTelegramNotification(`⚠️ <b>Cảnh báo</b>: Nhận được tiền (${amount}đ) cho đơn <b>${orderId}</b> nhưng không tìm thấy đơn này trong hệ thống!`);
      return NextResponse.json({ success: true, message: 'Đơn hàng không tồn tại' });
    }

    const order = rows[orderRowIndex];
    const customerEmail = order[2];
    const sku = order[3];
    const format = order[4]; // MP4 or MOV
    const expectedAmount = parseFloat(order[5]);
    const currentStatus = order[6];

    if (currentStatus === 'completed') {
      return NextResponse.json({ success: true, message: 'Đơn hàng đã được xử lý trước đó' });
    }

    if (amount < expectedAmount) {
      await sendTelegramNotification(`⚠️ <b>Thiếu tiền</b>: Khách thanh toán đơn <b>${orderId}</b> nhưng số tiền gửi (${amount}đ) nhỏ hơn giá trị đơn (${expectedAmount}đ).`);
      return NextResponse.json({ success: true, message: 'Thanh toán không đủ' });
    }

    // 4. Lấy ID File Gốc từ kho Video (Products)
    const products = await getProducts();
    const product = products.find((p) => p.sku === sku);

    if (!product) {
      await sendTelegramNotification(`❌ <b>Lỗi</b>: Khách đã mua mã <b>${sku}</b> nhưng sản phẩm này không tồn tại trong kho.`);
      return NextResponse.json({ success: true, message: 'Sản phẩm không tồn tại' });
    }

    // Xác định file cần cấp quyền dựa trên định dạng khách mua
    const fileIdToGrant = format.toUpperCase() === 'MOV' ? product.driveGocMovId : product.driveGocMp4Id;

    if (!fileIdToGrant) {
      await sendTelegramNotification(`❌ <b>Lỗi kho</b>: Sản phẩm <b>${sku}</b> bị thiếu File Gốc (${format}) trên Google Drive! Khách đã thanh toán.`);
      return NextResponse.json({ success: true, message: 'File gốc không tồn tại' });
    }

    // 5. Gọi API cấp quyền Google Drive cho khách hàng
    const grantSuccess = await grantDrivePermission(fileIdToGrant, customerEmail);

    if (!grantSuccess) {
      await sendTelegramNotification(`⚠️ <b>Lỗi cấp quyền</b>: Không thể share file cho email <b>${customerEmail}</b>. Hãy xử lý thủ công.`);
      return NextResponse.json({ success: false, message: 'Lỗi cấp quyền Drive' }, { status: 500 });
    }

    // 6. Cập nhật Trạng thái đơn hàng trên Google Sheets
    const updateRange = `Orders!G${orderRowIndex + 1}`; // Cột G là Trạng thái
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['completed']]
      }
    });

    // 7. Gửi thông báo thành công qua Telegram
    const msg = `✅ <b>Thành công</b>: Đơn hàng <b>${orderId}</b> đã thanh toán!\n` +
                `- Sản phẩm: ${product.name} (${sku})\n` +
                `- Khách hàng: ${customerEmail}\n` +
                `- Đã cấp quyền tải tự động.`;
    await sendTelegramNotification(msg);

    // 8. Gửi Email thông báo cho khách hàng
    const settings = await getSettings();
    if (settings.emailTemplate) {
      let emailHtml = settings.emailTemplate;
      
      // Lấy link thư mục dựa trên file (mở rộng lấy thư mục cha nếu cần, hoặc gửi link preview)
      const driveLink = `https://drive.google.com/file/d/${fileIdToGrant}/view`;

      // Thay thế các biến số
      emailHtml = emailHtml.replace(/{{order_id}}/g, orderId);
      emailHtml = emailHtml.replace(/{{customer_email}}/g, customerEmail);
      emailHtml = emailHtml.replace(/{{product_name}}/g, product.name);
      emailHtml = emailHtml.replace(/{{sku}}/g, sku);
      emailHtml = emailHtml.replace(/{{format}}/g, format);
      emailHtml = emailHtml.replace(/{{drive_link}}/g, driveLink);

      await sendEmail({
        to: customerEmail,
        subject: `[KenVideo] Đơn hàng ${orderId} đã hoàn tất - Truy cập Video của bạn`,
        html: emailHtml,
      });
      console.log(`[Webhook] Đã gửi email cho ${customerEmail}`);
    } else {
      console.log(`[Webhook] Bỏ qua gửi email vì chưa cài đặt template.`);
    }

    return NextResponse.json({ success: true, message: 'Xử lý đơn hàng thành công' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
