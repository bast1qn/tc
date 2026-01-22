import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, requireSuperAdmin, createAdminUser, getAllAdminUsers, deleteAdminUser } from '@/lib/auth/admin';
import { AdminRole } from '@prisma/client';

/**
 * GET /api/admin/users
 * Get all admin users
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const sessionResult = await verifyAdminSession();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: sessionResult.error || 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const users = await getAllAdminUsers();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get admin users error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Benutzer' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new admin user (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin session
    const sessionResult = await requireSuperAdmin();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: sessionResult.error || 'Nicht autorisiert' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, role } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN];
    const adminRole = role || AdminRole.ADMIN;

    if (!validRoles.includes(adminRole)) {
      return NextResponse.json(
        { error: 'Ungültige Rolle' },
        { status: 400 }
      );
    }

    // Create admin user
    const result = await createAdminUser({
      username,
      password,
      role: adminRole,
      createdBy: sessionResult.admin.adminId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Benutzererstellung fehlgeschlagen' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.admin,
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json(
      { error: 'Benutzererstellung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete an admin user (Super Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin session
    const sessionResult = await requireSuperAdmin();

    if (!sessionResult.valid || !sessionResult.admin) {
      return NextResponse.json(
        { error: sessionResult.error || 'Nicht autorisiert' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Delete admin user
    const result = await deleteAdminUser(userId, sessionResult.admin.adminId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Löschen fehlgeschlagen' },
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
