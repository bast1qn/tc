import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth/admin';

/**
 * Admin Logout API
 * POST /api/auth/admin/logout
 */
export async function POST(request: NextRequest) {
  try {
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
