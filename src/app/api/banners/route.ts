import { NextResponse } from 'next/server';
import { getBanners, addBanner, updateBanner, deleteBanner } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banners = await getBanners();
    return NextResponse.json(banners, {
      headers: {
        // Banner thay đổi rất ít → cache 2 phút, stale 10 phút
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, mediaType, mediaUrl, linkUrl, order, status } = body;

    if (!mediaType || !mediaUrl) {
      return NextResponse.json({ error: 'MediaType and MediaUrl are required' }, { status: 400 });
    }

    const success = await addBanner({
      title,
      subtitle,
      mediaType,
      mediaUrl,
      linkUrl,
      order: parseInt(order) || 0,
      status: status || 'active',
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to add banner' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, subtitle, mediaType, mediaUrl, linkUrl, order, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const success = await updateBanner(id, {
      title,
      subtitle,
      mediaType,
      mediaUrl,
      linkUrl,
      order: order !== undefined ? parseInt(order) || 0 : undefined,
      status: status,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update banner or banner not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const success = await deleteBanner(id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete banner or banner not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
