import { drive } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

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
    const resHeaders: Record<string, string> = {
      'Content-Type': (driveRes.headers['content-type'] as string) || 'video/mp4',
      'Accept-Ranges': 'bytes',
      // Disable caching for media streams so Range requests (206 Partial Content) work correctly in browsers
      'Cache-Control': 'no-cache, no-store, must-revalidate',
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
