import { prisma } from '@/lib/database';
import { compare, hash } from 'bcrypt';

const SALT_ROUNDS = 12;

export interface CustomerLoginInput {
  email: string;
  tcNummer: string;
}

export interface CustomerAuthResult {
  success: boolean;
  customer?: {
    id: string;
    email: string;
    tcNummer: string;
    submissionId: string;
  };
  error?: string;
}

/**
 * Authenticate a customer using email and TC number
 * For initial login, the customer needs to set up a password first
 */
export async function authenticateCustomer(input: CustomerLoginInput): Promise<CustomerAuthResult> {
  try {
    const { email, tcNummer } = input;

    if (!email || !tcNummer) {
      return { success: false, error: 'E-Mail und TC-Nummer sind erforderlich' };
    }

    // Find customer by email and TC number
    const submissionId = await getSubmissionIdByEmailAndTc(email, tcNummer);
    if (!submissionId) {
      return { success: false, error: 'Kein Kunde mit diesen Daten gefunden' };
    }

    const customer = await prisma.customer.findUnique({
      where: { submissionId: submissionId ?? undefined },
      include: { submission: true },
    });

    if (!customer) {
      return { success: false, error: 'Kein Kunde mit diesen Daten gefunden' };
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        tcNummer: customer.tcNummer,
        submissionId: customer.submissionId,
      },
    };
  } catch (error) {
    console.error('Customer authentication error:', error);
    return { success: false, error: 'Authentifizierung fehlgeschlagen' };
  }
}

/**
 * Get customer by submission ID
 */
export async function getCustomerBySubmissionId(submissionId: string) {
  try {
    return await prisma.customer.findUnique({
      where: { submissionId },
      include: { submission: true },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

/**
 * Verify customer password
 */
export async function verifyCustomerPassword(submissionId: string, password: string): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { submissionId },
      select: { passwordHash: true },
    });

    if (!customer) {
      return false;
    }

    return await compare(password, customer.passwordHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Create a customer account with password
 */
export async function createCustomerAccount(input: {
  submissionId: string;
  email: string;
  tcNummer: string;
  password: string;
}): Promise<CustomerAuthResult> {
  try {
    const { submissionId, email, tcNummer, password } = input;

    // Validate input
    if (!submissionId || !email || !tcNummer || !password) {
      return { success: false, error: 'Alle Felder sind erforderlich' };
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return { success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein' };
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { submissionId },
    });

    if (existingCustomer) {
      return { success: false, error: 'Konto existiert bereits' };
    }

    // Hash password
    const passwordHash = await hash(password, SALT_ROUNDS);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        submissionId,
        email,
        tcNummer,
        passwordHash,
      },
    });

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        tcNummer: customer.tcNummer,
        submissionId: customer.submissionId,
      },
    };
  } catch (error) {
    console.error('Customer creation error:', error);
    return { success: false, error: 'Kontoerstellung fehlgeschlagen' };
  }
}

/**
 * Change customer password
 */
export async function changeCustomerPassword(
  submissionId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify old password
    const isValid = await verifyCustomerPassword(submissionId, oldPassword);
    if (!isValid) {
      return { success: false, error: 'Aktuelles Passwort ist falsch' };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein' };
    }

    // Hash new password
    const passwordHash = await hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.customer.update({
      where: { submissionId },
      data: { passwordHash },
    });

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'Passwortänderung fehlgeschlagen' };
  }
}

/**
 * Get submission ID by email and TC number
 */
async function getSubmissionIdByEmailAndTc(email: string, tcNummer: string): Promise<string | null> {
  const submission = await prisma.submission.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      tcNummer: { equals: tcNummer, mode: 'insensitive' },
    },
    select: { id: true },
  });

  return submission?.id || null;
}
