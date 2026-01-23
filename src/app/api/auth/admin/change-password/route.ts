import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, changeAdminPassword } from '@/lib/auth/admin';
import { AdminRole } from '@prisma/client';

/**
 * Admin Change Password API
 * POST /api/auth/admin/change-password
 *
 * Body: {
 *   oldPassword?: string,
 *   newPassword: string,
 *   skipOldPasswordCheck?: boolean,
 *   targetAdminId?: string  // For ADMIN changing other users' passwords
 * }
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
    const { oldPassword, newPassword, skipOldPasswordCheck, targetAdminId } = body;

    // Determine target admin ID (for changing another user's password)
    const targetId = targetAdminId || sessionResult.admin.adminId;

    // Only ADMIN can change other users' passwords
    if (targetAdminId && sessionResult.admin.role !== AdminRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nur Admins können Passwörter anderer ändern' },
        { status: 403 }
      );
    }

    // Validate new password
    if (!newPassword) {
      return NextResponse.json(
        { error: 'Neues Passwort ist erforderlich' },
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

    // For changing own password, validate old password unless skipping
    const isChangingOwnPassword = targetId === sessionResult.admin.adminId;
    if (isChangingOwnPassword && !skipOldPasswordCheck && !oldPassword) {
      return NextResponse.json(
        { error: 'Aktuelles Passwort ist erforderlich' },
        { status: 400 }
      );
    }

    // Change password (admin changing another user's password skips old password check)
    const result = await changeAdminPassword(
      targetId,
      !isChangingOwnPassword || skipOldPasswordCheck ? newPassword : oldPassword,
      newPassword,
      { skipOldPasswordCheck: !isChangingOwnPassword || skipOldPasswordCheck }
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
