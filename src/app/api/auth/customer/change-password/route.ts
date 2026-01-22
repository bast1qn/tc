import { NextRequest, NextResponse } from 'next/server';
import { changeCustomerPassword, getCustomerBySubmissionId } from '@/lib/auth/customer';
import { cookies } from 'next/headers';

const CUSTOMER_SESSION_COOKIE = 'customer_session';

/**
 * Customer Change Password API
 * POST /api/auth/customer/change-password
 *
 * Body: { oldPassword: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify customer session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE);

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Parse session data
    let session;
    try {
      session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch {
      return NextResponse.json(
        { error: 'Ungültige Sitzung' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Altes und neues Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Das Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Change password
    const result = await changeCustomerPassword(
      session.submissionId,
      oldPassword,
      newPassword
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Passwortänderung fehlgeschlagen' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer change password error:', error);
    return NextResponse.json(
      { error: 'Passwortänderung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
