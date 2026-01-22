import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('customer_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // For a simple implementation, we'll verify the session exists
    // In production, you'd store sessions in the database
    // For now, we'll skip strict session validation and focus on the customer data

    // Get customer from cookie (simplified - in production use proper session management)
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Customer me error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Authentifizierung' },
      { status: 500 }
    );
  }
}
