import { prisma } from '@/lib/database';

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// Helper to get user ID from Supabase session
export async function getUserIdFromSupabaseId(supabaseId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
}

// Helper to format activity log for display
export function formatActivityLog(log: {
  action: string;
  entityType: string;
  oldValue: string | null;
  newValue: string | null;
}) {
  const { action, entityType, oldValue, newValue } = log;

  const actionLabels: Record<string, string> = {
    created: 'Erstellt',
    updated: 'Aktualisiert',
    deleted: 'Gelöscht',
    status_changed: 'Status geändert',
    field_updated: 'Feld aktualisiert',
  };

  const entityTypeLabels: Record<string, string> = {
    submission: 'Anfrage',
    user: 'Benutzer',
  };

  const actionLabel = actionLabels[action] || action;
  const entityTypeLabel = entityTypeLabels[entityType] || entityType;

  let details = '';
  if (action === 'status_changed') {
    details = `von "${oldValue}" zu "${newValue}"`;
  } else if (action === 'field_updated' && newValue) {
    details = `neuer Wert: "${newValue}"`;
  }

  return `${entityTypeLabel} ${actionLabel}${details ? ` - ${details}` : ''}`;
}
