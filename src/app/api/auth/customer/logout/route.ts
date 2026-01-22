import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear session cookie
  response.cookies.delete('customer_session');

  return response;
}
