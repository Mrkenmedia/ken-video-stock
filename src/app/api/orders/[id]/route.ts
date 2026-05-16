import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A2:G', // orderId, date, email, sku, format, totalPrice, status
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderRow = rows.find(row => row[0] === orderId);

    if (!orderRow) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      orderId: orderRow[0],
      status: orderRow[6],
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
