import { NextRequest, NextResponse } from 'next/server';
import { createCustomerAccount, getCustomerBySubmissionId } from '@/lib/auth/customer';
import { prisma } from '@/lib/database';

/**
 * Customer Password Setup API
 * POST /api/auth/customer/setup-password
 *
 * Body: { email: string, tcNummer: string, password: string }
 *
 * Allows a customer to set up their password for the first time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tcNummer, password } = body;

    // Validate required fields
    if (!email || !tcNummer || !password) {
      return NextResponse.json(
        { error: 'E-Mail, TC-Nummer und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Das Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Find submission by email and TC number
    const submission = await prisma.submission.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        tcNummer: { equals: tcNummer, mode: 'insensitive' },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Keine Meldung mit diesen Daten gefunden' },
        { status: 404 }
      );
    }

    // Check if customer already has a password set
    const existingCustomer = await getCustomerBySubmissionId(submission.id);
    if (existingCustomer && existingCustomer.passwordHash && existingCustomer.passwordHash.length > 0) {
      return NextResponse.json(
        { error: 'Für dieses Konto wurde bereits ein Passwort gesetzt. Bitte verwenden Sie die Login-Funktion.' },
        { status: 400 }
      );
    }

    // Create customer account or update password
    const { hash } = await import('bcrypt');
    const passwordHash = await hash(password, 12);

    if (existingCustomer) {
      // Update existing customer with password
      await prisma.customer.update({
        where: { submissionId: submission.id },
        data: { passwordHash },
      });
    } else {
      // Create new customer account
      await prisma.customer.create({
        data: {
          submissionId: submission.id,
          email: submission.email,
          tcNummer: submission.tcNummer,
          passwordHash,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich gesetzt',
    });
  } catch (error) {
    console.error('Customer password setup error:', error);
    return NextResponse.json(
      { error: 'Passwort-Setup fehlgeschlagen' },
      { status: 500 }
    );
  }
}
