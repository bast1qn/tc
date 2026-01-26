import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { cookies } from 'next/headers';

const CUSTOMER_SESSION_COOKIE = 'customer_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface CustomerSession {
  customerId: string;
  email: string;
  tcNummer: string;
  submissionId: string;
}

/**
 * Customer Login API
 * POST /api/auth/customer/login
 *
 * Body: { email: string, tcNummer: string }
 *
 * Simple login with email + TC number - no password required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tcNummer } = body;

    // Validate required fields
    if (!email || !tcNummer) {
      return NextResponse.json(
        { error: 'E-Mail und TC-Nummer sind erforderlich' },
        { status: 400 }
      );
    }

    // Find submission directly by email and TC number
    const submission = await prisma.submission.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        tcNummer: { equals: tcNummer, mode: 'insensitive' },
      },
      select: {
        id: true,
        email: true,
        tcNummer: true,
        vorname: true,
        nachname: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Keine Meldung mit diesen Daten gefunden' },
        { status: 401 }
      );
    }

    // Create session
    const session: CustomerSession = {
      customerId: submission.id,
      email: submission.email,
      tcNummer: submission.tcNummer,
      submissionId: submission.id,
    };

    // Set session cookie
    const cookieStore = await cookies();
    const sessionValue = Buffer.from(JSON.stringify(session)).toString('base64');

    cookieStore.set(CUSTOMER_SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: submission.id,
        email: submission.email,
        tcNummer: submission.tcNummer,
        vorname: submission.vorname,
        nachname: submission.nachname,
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'Login fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * Customer Logout API
 * DELETE /api/auth/customer/login
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CUSTOMER_SESSION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer logout error:', error);
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    );
  }
}
