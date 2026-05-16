import { NextResponse } from 'next/server';
import { getTiers, ensureTiersSheet } from '@/lib/google';

export async function GET() {
  try {
    await ensureTiersSheet();
    const tiers = await getTiers();
    return NextResponse.json(tiers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
  }
}
