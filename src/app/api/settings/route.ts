import { NextResponse } from 'next/server';
import { getSettings, updateSetting, ensureSettingsSheet } from '@/lib/google';

export async function GET() {
  try {
    await ensureSettingsSheet();
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    await ensureSettingsSheet();
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
