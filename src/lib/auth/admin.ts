import { prisma } from '@/lib/database';
import { compare, hash } from 'bcrypt';
import { AdminRole } from '@prisma/client';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 12;

const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface AdminLoginInput {
  username: string;
  password: string;
}

export interface AdminAuthResult {
  success: boolean;
  admin?: {
    id: string;
    username: string;
    role: AdminRole;
    mustChangePassword: boolean;
  };
  error?: string;
}

export interface AdminSession {
  adminId: string;
  username: string;
  role: AdminRole;
}

/**
 * Authenticate an admin user
 */
export async function authenticateAdmin(input: AdminLoginInput): Promise<AdminAuthResult> {
  try {
    const { username, password } = input;

    if (!username || !password) {
      return { success: false, error: 'Benutzername und Passwort sind erforderlich' };
    }

    // Find admin by username
    const admin = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin) {
      return { success: false, error: 'Ungültige Anmeldedaten' };
    }

    // Verify password
    const isValid = await compare(password, admin.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Ungültige Anmeldedaten' };
    }

    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
      },
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return { success: false, error: 'Authentifizierung fehlgeschlagen' };
  }
}

/**
 * Get current admin session from cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie) {
      return null;
    }

    // Parse session data (base64 encoded JSON)
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());

    // Verify admin still exists and is valid
    const admin = await prisma.adminUser.findUnique({
      where: { id: sessionData.adminId },
    });

    if (!admin) {
      return null;
    }

    return {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Set admin session cookie
 */
export async function setAdminSession(session: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  const sessionValue = Buffer.from(JSON.stringify(session)).toString('base64');

  cookieStore.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Verify admin session for protected routes
 */
export async function verifyAdminSession(): Promise<{ valid: boolean; admin?: AdminSession; error?: string }> {
  try {
    const session = await getAdminSession();

    if (!session) {
      return { valid: false, error: 'Nicht authentifiziert' };
    }

    return { valid: true, admin: session };
  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false, error: 'Sitzung ungültig' };
  }
}

/**
 * Check if admin has required role
 */
export function hasRequiredRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy = {
    [AdminRole.ADMIN]: 1,
    [AdminRole.STAFF]: 0,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Require admin role (full access)
 */
export async function requireAdminRole(): Promise<{ valid: boolean; admin?: AdminSession; error?: string }> {
  const result = await verifyAdminSession();

  if (!result.valid || !result.admin) {
    return result;
  }

  if (result.admin.role !== AdminRole.ADMIN) {
    return { valid: false, error: 'Nur Admins haben Zugriff' };
  }

  return { valid: true, admin: result.admin };
}

/**
 * Create a new admin user
 */
export async function createAdminUser(input: {
  username: string;
  password: string;
  role: AdminRole;
  createdBy: string;
}): Promise<{ success: boolean; admin?: { id: string; username: string }; error?: string }> {
  try {
    const { username, password, role, createdBy } = input;

    // Validate input
    if (!username || !password) {
      return { success: false, error: 'Benutzername und Passwort sind erforderlich' };
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return { success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein' };
    }

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      return { success: false, error: 'Benutzername bereits vergeben' };
    }

    // Hash password
    const passwordHash = await hash(password, SALT_ROUNDS);

    // Create admin
    const admin = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        role,
        createdBy,
        mustChangePassword: true, // New admins must change password
      },
      select: {
        id: true,
        username: true,
      },
    });

    return { success: true, admin };
  } catch (error) {
    console.error('Admin creation error:', error);
    return { success: false, error: 'Benutzererstellung fehlgeschlagen' };
  }
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  adminId: string,
  oldPassword: string,
  newPassword: string,
  options?: { skipOldPasswordCheck?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get admin with password
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { passwordHash: true },
    });

    if (!admin) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // Verify old password unless skipping
    if (!options?.skipOldPasswordCheck) {
      const isValid = await compare(oldPassword, admin.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Aktuelles Passwort ist falsch' };
      }
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein' };
    }

    // Hash new password
    const passwordHash = await hash(newPassword, SALT_ROUNDS);

    // Update password and clear mustChangePassword flag
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash, mustChangePassword: false },
    });

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'Passwortänderung fehlgeschlagen' };
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers() {
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return admins.map(admin => ({
      ...admin,
      createdAt: admin.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

/**
 * Delete admin user
 */
export async function deleteAdminUser(adminId: string, requestingAdminId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Prevent self-deletion
    if (adminId === requestingAdminId) {
      return { success: false, error: 'Sie können sich nicht selbst löschen' };
    }

    await prisma.adminUser.delete({
      where: { id: adminId },
    });

    return { success: true };
  } catch (error) {
    console.error('Admin deletion error:', error);
    return { success: false, error: 'Löschen fehlgeschlagen' };
  }
}
