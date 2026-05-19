import { drive } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return new Response('Missing file ID', { status: 400 });
    }

    const meta = await drive.files.get({
      fileId: fileId,
      fields: 'thumbnailLink',
    });

    if (meta.data.thumbnailLink) {
      // Fetch the thumbnail image from our server to bypass Google login restrictions
      const thumbRes = await fetch(meta.data.thumbnailLink);
      if (!thumbRes.ok) {
        return new Response('Failed to fetch thumbnail from Google', { status: thumbRes.status });
      }
      
      const arrayBuffer = await thumbRes.arrayBuffer();
      const contentType = thumbRes.headers.get('content-type') || 'image/jpeg';
      
      return new Response(arrayBuffer, {
        headers: {
          'Content-Type': contentType,
          // Cache the thumbnail publicly for 1 year
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400',
        }
      });
    } else {
      return new Response('No thumbnail found', { status: 404 });
    }
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    return new Response('Error retrieving thumbnail', { status: 500 });
  }
}
