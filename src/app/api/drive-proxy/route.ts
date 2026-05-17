import { drive } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

// --- GLOBAL METADATA CACHE ---
// Tránh gọi API Google Drive nhiều lần chỉ để lấy MimeType
const metaCache = new Map<string, { mimeType: string; size?: string }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return new Response('Missing file ID', { status: 400 });
    }

    const rangeHeader = request.headers.get('range');
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    // Lấy metadata từ Cache nếu có, ngược lại gọi API
    let mimeType = 'application/octet-stream';
    let size: string | undefined;
    
    if (metaCache.has(fileId)) {
      const cached = metaCache.get(fileId)!;
      mimeType = cached.mimeType;
      size = cached.size;
    } else {
      try {
        const meta = await drive.files.get({
          fileId: fileId,
          fields: 'mimeType,size',
        });
        mimeType = meta.data.mimeType || 'application/octet-stream';
        size = meta.data.size ? meta.data.size.toString() : undefined;
        metaCache.set(fileId, { mimeType, size });
      } catch (err) {
        console.warn('Could not fetch metadata for file:', fileId);
      }
    }

    // Fetch the actual file stream from Google Drive
    const driveRes = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      {
        headers,
        responseType: 'stream',
      }
    );

    // Get the response stream from googleapi Node.js client
    const nodeStream = driveRes.data as unknown as Readable;

    // Convert Node stream to Web Stream for Next.js App Router Response
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        nodeStream.on('end', () => {
          controller.close();
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        nodeStream.destroy();
      }
    });

    const resHeaders: Record<string, string> = {
      'Content-Type': mimeType,
      // s-maxage cho phép Vercel Edge CDN cache file này, chống vượt quá giới hạn Drive!
      'Cache-Control': 'public, s-maxage=31536000, max-age=31536000, stale-while-revalidate=86400',
    };

    if (driveRes.headers['content-range']) {
      resHeaders['Content-Range'] = driveRes.headers['content-range'] as string;
    }
    if (driveRes.headers['content-length']) {
      resHeaders['Content-Length'] = driveRes.headers['content-length'] as string;
    }
    if (driveRes.headers['accept-ranges']) {
      resHeaders['Accept-Ranges'] = driveRes.headers['accept-ranges'] as string;
    }

    return new Response(webStream, {
      status: driveRes.status || 200,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('Drive proxy error:', error);
    return new Response('Error retrieving file', { status: 500 });
  }
}
