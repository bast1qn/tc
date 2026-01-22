import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, setAdminSession } from '@/lib/auth/admin';
import { AdminRole } from '@prisma/client';

/**
 * Admin Login API
 * POST /api/auth/admin/login
 *
 * Body: { username: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const authResult = await authenticateAdmin({ username, password });

    if (!authResult.success || !authResult.admin) {
      return NextResponse.json(
        { error: authResult.error || 'Authentifizierung fehlgeschlagen' },
        { status: 401 }
      );
    }

    const { admin } = authResult;

    // Create session
    await setAdminSession({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login fehlgeschlagen' },
      { status: 500 }
    );
  }
}
