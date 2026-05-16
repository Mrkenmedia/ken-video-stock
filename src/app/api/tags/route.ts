import { NextResponse } from 'next/server';
import { getTags, addTag, updateTag, deleteTag, ensureTagsSheet } from '@/lib/google';

// Helper to prepare sheet (creates "Tags" tab if missing)
async function init() {
  await ensureTagsSheet();
}

/** GET /api/tags – trả về danh sách toàn bộ tag */
export async function GET() {
  try {
    await init();
    const tags = await getTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return NextResponse.json({ error: 'Cannot fetch tags' }, { status: 500 });
  }
}

/** POST /api/tags – thêm tag mới */
export async function POST(request: Request) {
  try {
    await init();
    const { tag } = await request.json();
    if (!tag) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
    const ok = await addTag(tag);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('POST /api/tags error:', error);
    return NextResponse.json({ error: 'Cannot add tag' }, { status: 500 });
  }
}

/** PUT /api/tags – cập nhật tên tag */
export async function PUT(request: Request) {
  try {
    await init();
    const { oldTag, newTag } = await request.json();
    if (!oldTag || !newTag) return NextResponse.json({ error: 'Missing oldTag or newTag' }, { status: 400 });
    const ok = await updateTag(oldTag, newTag);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('PUT /api/tags error:', error);
    return NextResponse.json({ error: 'Cannot update tag' }, { status: 500 });
  }
}

/** DELETE /api/tags – xóa tag */
export async function DELETE(request: Request) {
  try {
    await init();
    const { tag } = await request.json();
    if (!tag) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
    const ok = await deleteTag(tag);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error('DELETE /api/tags error:', error);
    return NextResponse.json({ error: 'Cannot delete tag' }, { status: 500 });
  }
}
