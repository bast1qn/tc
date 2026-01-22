import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/database';

const CUSTOMER_SESSION_COOKIE = 'customer_session';

export interface CustomerSession {
  customerId: string;
  email: string;
  tcNummer: string;
  submissionId: string;
}

/**
 * Customer Session Verify API
 * GET /api/auth/customer/verify
 *
 * Verifies the customer session and returns customer data if valid
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE);

    if (!sessionCookie) {
      return NextResponse.json(
        { valid: false, error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Parse session data (base64 encoded JSON)
    let session: CustomerSession;
    try {
      session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch {
      return NextResponse.json(
        { valid: false, error: 'Ungültige Sitzung' },
        { status: 401 }
      );
    }

    // Verify customer still exists
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        submission: {
          include: { files: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { valid: false, error: 'Kunde nicht gefunden' },
        { status: 401 }
      );
    }

    // Return customer data
    return NextResponse.json({
      valid: true,
      customer: {
        id: customer.id,
        email: customer.email,
        tcNummer: customer.tcNummer,
        submissionId: customer.submissionId,
        submission: customer.submission,
      },
    });
  } catch (error) {
    console.error('Customer verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verifizierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
