import { NextResponse } from 'next/server';
import { getSettings, updateSetting, ensureSettingsSheet } from '@/lib/google';

export const dynamic = 'force-dynamic';

export const revalidate = 300;

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await ensureSettingsSheet();

    // Check if it is a batch settings update
    if (body.settings && typeof body.settings === 'object') {
      const entries = Object.entries(body.settings);
      for (const [key, value] of entries) {
        await updateSetting(key, String(value));
      }
      return NextResponse.json({ success: true });
    }

    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    const success = await updateSetting(key, value);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
