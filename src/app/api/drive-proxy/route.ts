import { drive } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

function getHeader(headersObj: any, name: string): string | undefined {
  if (!headersObj) return undefined;
  if (typeof headersObj.get === 'function') {
    return headersObj.get(name) || undefined;
  }
  return headersObj[name] || headersObj[name.toLowerCase()] || undefined;
}

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

    // Fetch the actual file stream from Google Drive directly without redundant metadata calls
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

    // Convert Node stream to Web Stream for Next.js App Router Response natively and safely
    const webStream = Readable.toWeb(nodeStream);

    // Copy essential streaming headers from Google Drive's response
    const contentType = getHeader(driveRes.headers, 'content-type') || 'video/mp4';
    const contentRange = getHeader(driveRes.headers, 'content-range');
    const contentLength = getHeader(driveRes.headers, 'content-length');
    const acceptRanges = getHeader(driveRes.headers, 'accept-ranges') || 'bytes';

    const resHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': acceptRanges,
      // Disable caching for media streams so Range requests (206 Partial Content) work correctly in browsers
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    if (contentRange) {
      resHeaders['Content-Range'] = contentRange;
    }
    if (contentLength) {
      resHeaders['Content-Length'] = contentLength;
    }

    return new Response(webStream as any, {
      status: driveRes.status || 200,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('Drive proxy error:', error);
    return new Response('Error retrieving file', { status: 500 });
  }
}
