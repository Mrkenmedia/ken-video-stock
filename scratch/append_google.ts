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
      range: 'Orders!A:G', // Giả sử bảng Orders có các cột: Mã Đơn, Ngày, Email, SKU, Định dạng, Tổng tiền, Log
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
