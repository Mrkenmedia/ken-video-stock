import { NextResponse } from 'next/server';
import { getTiers, updateTiers, ensureTiersSheet } from '@/lib/google';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tiers = await getTiers();
    return NextResponse.json(tiers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tiers } = body;
    
    if (!Array.isArray(tiers)) {
      return NextResponse.json({ error: 'Invalid tiers data' }, { status: 400 });
    }

    await ensureTiersSheet();
    const success = await updateTiers(tiers);

    if (success) {
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update tiers' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to update tiers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
