import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAdminRole } from '@/lib/auth/admin';

export type MasterDataType = 'bauleitung' | 'verantwortlicher' | 'gewerk' | 'firma';

// DELETE master data item (soft delete by setting active = false) - Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session - only admins can delete master data
    const sessionResult = await requireAdminRole();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: 'Nur Admins dürfen Stammdaten löschen' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as MasterDataType | null;

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    let item;

    if (type === 'bauleitung') {
      item = await prisma.bauleitung.update({
        where: { id },
        data: { active: false },
      });
    } else if (type === 'verantwortlicher') {
      item = await prisma.verantwortlicher.update({
        where: { id },
        data: { active: false },
      });
    } else if (type === 'gewerk') {
      item = await prisma.gewerk.update({
        where: { id },
        data: { active: false },
      });
    } else if (type === 'firma') {
      item = await prisma.firma.update({
        where: { id },
        data: { active: false },
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('DELETE master-data error:', error);
    return NextResponse.json({ error: 'Failed to delete master data item' }, { status: 500 });
  }
}
