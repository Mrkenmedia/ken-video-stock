import { drive } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

function getHeader(headersObj: any, name: string): string | undefined {
  if (!headersObj) return undefined;
  if (typeof headersObj.get === 'function') {
    return headersObj.get(name) || undefined;
  }
  return headersObj[name] ?? headersObj[name.toLowerCase()];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return new Response('Missing file ID', { status: 400 });
    }

    const rangeHeader = request.headers.get('range');
    const extraHeaders: Record<string, string> = {};
    if (rangeHeader) extraHeaders['Range'] = rangeHeader;

    // Fetch file stream from Google Drive (no extra metadata call)
    const driveRes = await drive.files.get(
      { fileId, alt: 'media' },
      { headers: extraHeaders, responseType: 'stream' }
    );

    const nodeStream = driveRes.data as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream);

    // Copy essential headers from Drive response
    const contentType   = getHeader(driveRes.headers, 'content-type')    ?? 'video/mp4';
    const contentRange  = getHeader(driveRes.headers, 'content-range');
    const contentLength = getHeader(driveRes.headers, 'content-length');
    const acceptRanges  = getHeader(driveRes.headers, 'accept-ranges')   ?? 'bytes';

    // ── ETag (conditional GET / 304 support) ───────────────────────────────
    // Base ETag on fileId + Drive's Last-Modified to uniquely identify the version.
    const lastModified = getHeader(driveRes.headers, 'last-modified') ?? new Date().toISOString();
    const eTag = `W/"${fileId}-${lastModified}"`;

    if (request.headers.get('if-none-match') === eTag) {
      // Client already has the latest version → save bandwidth
      return new Response(null, {
        status: 304,
        headers: { ETag: eTag },
      });
    }

    // ── Cache-Control based on content-length ──────────────────────────────
    // • Small files  (< 10 MB)  → preview/thumbnail clips → cache publicly 24 h
    // • Medium files (< 100 MB) → short clips → cache privately 1 h
    // • Large files  (≥ 100 MB) → full-resolution video → never cache (stream only)
    let cacheControl = 'no-store, no-cache, must-revalidate'; // default: large
    if (contentLength) {
      const len = Number(contentLength);
      if (len < 10 * 1024 * 1024) {
        cacheControl = 'public, max-age=86400, stale-while-revalidate=3600'; // 24 h
      } else if (len < 100 * 1024 * 1024) {
        cacheControl = 'private, max-age=3600'; // 1 h
      }
    }

    const resHeaders: Record<string, string> = {
      'Content-Type':   contentType,
      'Accept-Ranges':  acceptRanges,
      'Cache-Control':  cacheControl,
      'ETag':           eTag,
    };

    if (contentRange)  resHeaders['Content-Range']  = contentRange;
    if (contentLength) resHeaders['Content-Length'] = contentLength;

    return new Response(webStream as any, {
      status: driveRes.status || 200,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('Drive proxy error:', error);
    return new Response('Error retrieving file', { status: 500 });
  }
}
