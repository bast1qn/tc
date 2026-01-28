import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAdminRole } from '@/lib/auth/admin';

export type MasterDataType = 'bauleitung' | 'verantwortlicher' | 'gewerk' | 'firma';

// GET all master data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as MasterDataType | null;

    const data: Record<MasterDataType, any[]> = {
      bauleitung: await prisma.bauleitung.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      verantwortlicher: await prisma.verantwortlicher.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      gewerk: await prisma.gewerk.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      firma: await prisma.firma.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
    };

    // Wenn type angegeben, nur diesen Typ zurückgeben
    if (type && data[type]) {
      return NextResponse.json({ items: data[type] });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET master-data error:', error);
    return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 });
  }
}

// POST new master data item (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin session - only admins can add master data
    const sessionResult = await requireAdminRole();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: 'Nur Admins dürfen Stammdaten hinzufügen' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, name } = body;

    if (!type || !name) {
      return NextResponse.json({ error: 'Type and name are required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Prüfen und erstellen basierend auf Typ
    if (type === 'bauleitung') {
      const existing = await prisma.bauleitung.findFirst({
        where: { name: trimmedName },
      });
      if (existing) {
        return NextResponse.json({ error: 'Dieser Name existiert bereits' }, { status: 409 });
      }
      const item = await prisma.bauleitung.create({
        data: { name: trimmedName },
      });
      return NextResponse.json({ item });
    }

    if (type === 'verantwortlicher') {
      const existing = await prisma.verantwortlicher.findFirst({
        where: { name: trimmedName },
      });
      if (existing) {
        return NextResponse.json({ error: 'Dieser Name existiert bereits' }, { status: 409 });
      }
      const item = await prisma.verantwortlicher.create({
        data: { name: trimmedName },
      });
      return NextResponse.json({ item });
    }

    if (type === 'gewerk') {
      const existing = await prisma.gewerk.findFirst({
        where: { name: trimmedName },
      });
      if (existing) {
        return NextResponse.json({ error: 'Dieser Name existiert bereits' }, { status: 409 });
      }
      const item = await prisma.gewerk.create({
        data: { name: trimmedName },
      });
      return NextResponse.json({ item });
    }

    if (type === 'firma') {
      const existing = await prisma.firma.findFirst({
        where: { name: trimmedName },
      });
      if (existing) {
        return NextResponse.json({ error: 'Dieser Name existiert bereits' }, { status: 409 });
      }
      const item = await prisma.firma.create({
        data: { name: trimmedName },
      });
      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('POST master-data error:', error);
    return NextResponse.json({ error: 'Failed to create master data item' }, { status: 500 });
  }
}
