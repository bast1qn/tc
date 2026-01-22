import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { cookies } from 'next/headers';
import type { CustomerSession } from '../login/route';

const CUSTOMER_SESSION_COOKIE = 'customer_session';

/**
 * Get customer's submissions
 * GET /api/auth/customer/submissions
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE);

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Parse session data
    const session: CustomerSession = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    // Get all submissions for this customer's email
    const submissions = await prisma.submission.findMany({
      where: { email: session.email },
      include: { files: true },
      orderBy: { timestamp: 'desc' },
    });

    // Status mapping
    const statusReverseMapping: Record<string, string> = {
      'OFFEN': 'Offen',
      'IN_BEARBEITUNG': 'In Bearbeitung',
      'ERLEDIGT': 'Erledigt',
      'MAGEL_ABGELEHNT': 'Mangel abgelehnt',
    };

    // Transform to match frontend types
    const transformed = submissions.map(s => ({
      ...s,
      timestamp: s.timestamp.toISOString(),
      status: statusReverseMapping[s.status] || s.status,
      ersteFrist: s.ersteFrist?.toISOString() || null,
      zweiteFrist: s.zweiteFrist?.toISOString() || null,
      erledigtAm: s.erledigtAm?.toISOString() || null,
      files: s.files.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.url,
        uploadedAt: f.uploadedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ submissions: transformed });
  } catch (error) {
    console.error('Get customer submissions error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Meldungen' },
      { status: 500 }
    );
  }
}
