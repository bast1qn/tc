import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin';
import { prisma } from '@/lib/database';

/**
 * Admin Session Verify API
 * GET /api/auth/admin/verify
 *
 * Verifies the admin session and returns admin data if valid
 */
export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdminSession();

    if (!result.valid || !result.admin) {
      return NextResponse.json(
        { valid: false, error: result.error || 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Get full admin data
    const admin = await prisma.adminUser.findUnique({
      where: { id: result.admin.adminId },
      select: {
        id: true,
        username: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { valid: false, error: 'Admin nicht gefunden' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
        createdAt: admin.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verifizierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * Admin Logout API
 * DELETE /api/auth/admin/verify
 */
export async function DELETE(request: NextRequest) {
  try {
    const { clearAdminSession } = await import('@/lib/auth/admin');
    await clearAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    );
  }
}
