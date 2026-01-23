import { NextRequest, NextResponse } from 'next/server';
import { getAllAdminUsers, createAdminUser, deleteAdminUser, getAdminSession, verifyAdminSession } from '@/lib/auth/admin';
import { AdminRole } from '@prisma/client';

/**
 * Get all admin users
 * GET /api/auth/admin/users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const users = await getAllAdminUsers();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get admin users error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Benutzer' },
      { status: 500 }
    );
  }
}

/**
 * Create new admin user
 * POST /api/auth/admin/users
 *
 * Body: { username: string, password: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify session and role (ADMIN and SUPER_ADMIN can create users)
    const sessionResult = await verifyAdminSession();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: sessionResult.error || 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Benutzername, Passwort und Rolle sind erforderlich' },
        { status: 400 }
      );
    }

    if (!Object.values(AdminRole).includes(role)) {
      return NextResponse.json(
        { error: 'Ungültige Rolle' },
        { status: 400 }
      );
    }

    const adminRole = sessionResult.admin.role;

    // STAFF cannot create users
    if (adminRole === 'STAFF') {
      return NextResponse.json(
        { error: 'Mitarbeiter können keine Benutzer erstellen' },
        { status: 403 }
      );
    }

    // ADMIN can only create STAFF users
    if (adminRole === 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Admins können nur Mitarbeiter erstellen' },
        { status: 403 }
      );
    }

    // Only SUPER_ADMIN can create SUPER_ADMIN and ADMIN users
    if ((role === 'SUPER_ADMIN' || role === 'ADMIN') && adminRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Nur Super-Admins können Admins erstellen' },
        { status: 403 }
      );
    }

    const createResult = await createAdminUser({
      username,
      password,
      role,
      createdBy: sessionResult.admin.adminId,
    });

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, admin: createResult.admin });
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json(
      { error: 'Benutzererstellung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * Delete admin user
 * DELETE /api/auth/admin/users?id={userId}
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can delete users
    if (session.role !== AdminRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Nur Super-Admins können Benutzer löschen' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const deleteResult = await deleteAdminUser(userId, session.adminId);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return NextResponse.json(
      { error: 'Löschen fehlgeschlagen' },
      { status: 500 }
    );
  }
}
