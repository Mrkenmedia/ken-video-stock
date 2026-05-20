import { drive } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const size = searchParams.get('size') ?? '600'; // default 600px cho ảnh sắc nét ở grid

    if (!fileId) {
      return new Response('Missing file ID', { status: 400 });
    }

    // 1️⃣ Lấy thumbnailLink một lần duy nhất
    const meta = await drive.files.get({
      fileId,
      fields: 'thumbnailLink',
    });

    const thumbLink = meta.data.thumbnailLink;
    if (!thumbLink) {
      // Trả về 404 nhanh, không fetch thêm
      return new Response('No thumbnail found', { status: 404 });
    }

    // 2️⃣ Điều chỉnh kích thước (Google dùng =sXXX ở cuối URL)
    const finalUrl = thumbLink.includes('=s')
      ? thumbLink.replace(/=s\d+$/, `=s${size}`)
      : `${thumbLink}=s${size}`;

    // 3️⃣ ETag: dùng fileId + size để nhận dạng phiên bản
    const eTag = `W/"thumb-${fileId}-${size}"`;
    if (request.headers.get('if-none-match') === eTag) {
      // Client đã có thumbnail mới nhất → tiết kiệm băng thông
      return new Response(null, {
        status: 304,
        headers: { ETag: eTag },
      });
    }

    // 4️⃣ Fetch ảnh từ Google (bypass xác thực Google)
    const thumbRes = await fetch(finalUrl);
    if (!thumbRes.ok) {
      return new Response('Failed to fetch thumbnail from Google', { status: thumbRes.status });
    }

    const buffer = await thumbRes.arrayBuffer();
    const contentType = thumbRes.headers.get('content-type') ?? 'image/jpeg';

    // 5️⃣ Cache dài hạn: 1 năm (thumbnail gần như không đổi)
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'ETag': eTag,
        'Cache-Control':
          'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    return new Response('Error retrieving thumbnail', { status: 500 });
  }
}
