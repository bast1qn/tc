import { NextRequest, NextResponse } from 'next/server';
import { authenticateCustomer, verifyCustomerPassword, getCustomerBySubmissionId } from '@/lib/auth/customer';
import { cookies } from 'next/headers';

const CUSTOMER_SESSION_COOKIE = 'customer_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface CustomerSession {
  customerId: string;
  email: string;
  tcNummer: string;
  submissionId: string;
}

/**
 * Customer Login API
 * POST /api/auth/customer/login
 *
 * Body: { email: string, tcNummer: string, password?: string }
 *
 * First login: Customer verifies email + TC number, then sets password
 * Subsequent logins: Customer uses email + TC number + password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tcNummer, password } = body;

    // Validate required fields
    if (!email || !tcNummer) {
      return NextResponse.json(
        { error: 'E-Mail und TC-Nummer sind erforderlich' },
        { status: 400 }
      );
    }

    // Authenticate customer
    const authResult = await authenticateCustomer({ email, tcNummer });

    if (!authResult.success || !authResult.customer) {
      return NextResponse.json(
        { error: authResult.error || 'Authentifizierung fehlgeschlagen' },
        { status: 401 }
      );
    }

    const { customer } = authResult;

    // Check if customer has a password set
    const customerWithPassword = await getCustomerBySubmissionId(customer.submissionId);
    const hasPassword = customerWithPassword?.passwordHash && customerWithPassword.passwordHash.length > 0;

    // If password is provided, verify it
    if (hasPassword) {
      if (!password) {
        return NextResponse.json(
          {
            error: 'Passwort erforderlich',
            requiresPassword: true,
          },
          { status: 401 }
        );
      }

      const isValid = await verifyCustomerPassword(customer.submissionId, password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Ungültiges Passwort' },
          { status: 401 }
        );
      }
    }

    // Create session
    const session: CustomerSession = {
      customerId: customer.id,
      email: customer.email,
      tcNummer: customer.tcNummer,
      submissionId: customer.submissionId,
    };

    // Set session cookie
    const cookieStore = await cookies();
    const sessionValue = Buffer.from(JSON.stringify(session)).toString('base64');

    cookieStore.set(CUSTOMER_SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        tcNummer: customer.tcNummer,
        submissionId: customer.submissionId,
      },
      requiresPasswordSetup: !hasPassword,
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'Login fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * Customer Logout API
 * DELETE /api/auth/customer/login
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CUSTOMER_SESSION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer logout error:', error);
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    );
  }
}
