import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, changeAdminPassword } from '@/lib/auth/admin';

/**
 * Admin Change Password API
 * POST /api/auth/admin/change-password
 *
 * Body: { oldPassword: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const sessionResult = await verifyAdminSession();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: sessionResult.error || 'Nicht authentifiziert' },
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
    const result = await changeAdminPassword(
      sessionResult.admin.adminId,
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
    console.error('Admin change password error:', error);
    return NextResponse.json(
      { error: 'Passwortänderung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
