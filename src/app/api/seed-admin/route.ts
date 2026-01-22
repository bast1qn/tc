import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { hash } from 'bcrypt';

/**
 * One-time endpoint to create the default Admin account.
 * Call this after deployment to set up the initial admin user.
 *
 * DELETE this endpoint after use or add additional protection!
 */
export async function POST(request: Request) {
  // Simple protection: check for a secret key in environment or header
  const authHeader = request.headers.get('authorization');
  const secretKey = process.env.SEED_SECRET || 'initial-setup-2025';

  if (authHeader !== `Bearer ${secretKey}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { username: 'Admin' },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Admin account already exists',
        username: existing.username,
      });
    }

    // Create the admin account
    const passwordHash = await hash('admin123', 12);

    const admin = await prisma.adminUser.create({
      data: {
        username: 'Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        mustChangePassword: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        username: admin.username,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
      },
      loginInfo: {
        url: '/admin-login',
        username: 'Admin',
        password: 'admin123',
      },
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
