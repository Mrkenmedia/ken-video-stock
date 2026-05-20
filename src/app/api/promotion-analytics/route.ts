import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/** Đường dẫn lưu file analytics (trong thư mục .next/analytics để không bị git track) */
const DATA_FILE = path.join(process.cwd(), '.next', 'promotion-analytics.json');

interface AnalyticsData {
  totalImpressions: number;   // Tổng số lần banner được nhìn thấy
  uniqueSessions: number;     // Phiên độc lập (dùng sessionId từ cookie)
  lastUpdated: string;        // ISO timestamp lần cập nhật cuối
  dailyStats: Record<string, number>; // { "2026-06-01": 42, ... }
}

async function readData(): Promise<AnalyticsData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      totalImpressions: 0,
      uniqueSessions: 0,
      lastUpdated: new Date().toISOString(),
      dailyStats: {},
    };
  }
}

async function writeData(data: AnalyticsData) {
  // Đảm bảo thư mục tồn tại
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** GET /api/promotion-analytics — Lấy thống kê */
export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 });
  }
}

/** POST /api/promotion-analytics — Ghi nhận 1 lần xem banner */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const isNewSession: boolean = body?.isNewSession ?? false;

    const data = await readData();
    data.totalImpressions += 1;
    if (isNewSession) data.uniqueSessions += 1;

    // Cộng thêm vào thống kê theo ngày (YYYY-MM-DD theo giờ VN)
    const today = new Date()
      .toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // "2026-06-01"
    data.dailyStats[today] = (data.dailyStats[today] ?? 0) + 1;
    data.lastUpdated = new Date().toISOString();

    await writeData(data);
    return NextResponse.json({ success: true, totalImpressions: data.totalImpressions });
  } catch {
    return NextResponse.json({ error: 'Failed to record impression' }, { status: 500 });
  }
}
