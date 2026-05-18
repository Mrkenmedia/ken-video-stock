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
      // Return a redirect to the public thumbnail URL
      return Response.redirect(meta.data.thumbnailLink, 302);
    } else {
      return new Response('No thumbnail found', { status: 404 });
    }
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    return new Response('Error retrieving thumbnail', { status: 500 });
  }
}
