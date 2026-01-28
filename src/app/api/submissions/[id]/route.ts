import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { del } from '@vercel/blob';
import { Status } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { logActivity, getUserIdFromSupabaseId } from '@/lib/activity-log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;

  // Get user from Supabase if configured
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = await getUserIdFromSupabaseId(user.id);
    }
  } catch {
    // Supabase not configured, skip logging
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ersteFrist, zweiteFrist, bauleitung, verantwortlicher, gewerk, firma, abnahme } = body;

    const updateData: any = {};
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    // Get current submission for logging
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      select: { status: true, bauleitung: true, verantwortlicher: true, gewerk: true, firma: true, abnahme: true, ersteFrist: true, zweiteFrist: true },
    });

    // Status aktualisieren
    if (status !== undefined) {
      // Mapping von deutschen Status-Namen zu Enum-Werten
      const statusMapping: Record<string, Status> = {
        'Offen': Status.OFFEN,
        'In Bearbeitung': Status.IN_BEARBEITUNG,
        'Erledigt': Status.ERLEDIGT,
        'Mangel abgelehnt': Status.MAGEL_ABGELEHNT,
      };

      const statusEnum = statusMapping[status];
      if (!statusEnum) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      updateData.status = statusEnum;
      if (currentSubmission) {
        changes.push({ field: 'status', oldValue: currentSubmission.status, newValue: status });
      }
      // Wenn Status auf ERLEDIGT gesetzt wird, erledigtAm auf jetzt setzen
      if (statusEnum === Status.ERLEDIGT) {
        updateData.erledigtAm = new Date();
      }
    }

    // Fristen aktualisieren
    if (ersteFrist !== undefined) {
      const dateVal = ersteFrist ? new Date(ersteFrist) : null;
      updateData.ersteFrist = dateVal;
      if (currentSubmission) {
        changes.push({ field: 'ersteFrist', oldValue: currentSubmission.ersteFrist?.toISOString(), newValue: dateVal?.toISOString() });
      }
    }

    if (zweiteFrist !== undefined) {
      const dateVal = zweiteFrist ? new Date(zweiteFrist) : null;
      updateData.zweiteFrist = dateVal;
      if (currentSubmission) {
        changes.push({ field: 'zweiteFrist', oldValue: currentSubmission.zweiteFrist?.toISOString(), newValue: dateVal?.toISOString() });
      }
    }

    // Neue Felder aktualisieren
    // Für bauleitung, verantwortlicher, gewerk, firma: Name zu ID konvertieren
    if (bauleitung !== undefined) {
      if (bauleitung === null || bauleitung === '') {
        updateData.bauleitungId = null;
      } else {
        const bauleitungEntry = await prisma.bauleitung.findFirst({
          where: { name: bauleitung, active: true },
        });
        if (bauleitungEntry) {
          updateData.bauleitungId = bauleitungEntry.id;
        } else {
          // Fallback: Name als String speichern wenn nicht gefunden
          updateData.bauleitungId = null;
        }
      }
    }

    if (verantwortlicher !== undefined) {
      if (verantwortlicher === null || verantwortlicher === '') {
        updateData.verantwortlicherId = null;
      } else {
        const verantwortlicherEntry = await prisma.verantwortlicher.findFirst({
          where: { name: verantwortlicher, active: true },
        });
        if (verantwortlicherEntry) {
          updateData.verantwortlicherId = verantwortlicherEntry.id;
        } else {
          updateData.verantwortlicherId = null;
        }
      }
    }

    if (gewerk !== undefined) {
      if (gewerk === null || gewerk === '') {
        updateData.gewerkId = null;
      } else {
        const gewerkEntry = await prisma.gewerk.findFirst({
          where: { name: gewerk, active: true },
        });
        if (gewerkEntry) {
          updateData.gewerkId = gewerkEntry.id;
        } else {
          updateData.gewerkId = null;
        }
      }
    }

    if (firma !== undefined) {
      if (firma === null || firma === '') {
        updateData.firmaId = null;
      } else {
        const firmaEntry = await prisma.firma.findFirst({
          where: { name: firma, active: true },
        });
        if (firmaEntry) {
          updateData.firmaId = firmaEntry.id;
        } else {
          updateData.firmaId = null;
        }
      }
    }

    if (abnahme !== undefined) {
      updateData.abnahme = abnahme || null;
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
      include: { files: true },
    });

    // Log activity
    if (userId) {
      for (const change of changes) {
        if (change.field === 'status') {
          await logActivity({
            userId,
            action: 'status_changed',
            entityType: 'submission',
            entityId: id,
            oldValue: change.oldValue,
            newValue: change.newValue,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          });
        } else {
          await logActivity({
            userId,
            action: 'field_updated',
            entityType: 'submission',
            entityId: id,
            oldValue: change.oldValue?.toString() || '',
            newValue: change.newValue?.toString() || '',
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          });
        }
      }
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('PATCH submission error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;

  // Get user from Supabase if configured
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = await getUserIdFromSupabaseId(user.id);
    }
  } catch {
    // Supabase not configured, skip logging
  }

  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Log deletion before deleting
    if (userId) {
      await logActivity({
        userId,
        action: 'deleted',
        entityType: 'submission',
        entityId: id,
        oldValue: JSON.stringify({
          tcNummer: submission.tcNummer,
          vorname: submission.vorname,
          nachname: submission.nachname,
          status: submission.status,
        }),
        newValue: undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    // Delete files from Blob Storage
    for (const file of submission.files) {
      try {
        await del(file.url);
      } catch (error) {
        console.error(`Failed to delete blob: ${file.url}`, error);
        // Continue anyway - DB will still clean up
      }
    }

    // Delete submission (cascades to file records)
    await prisma.submission.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE submission error:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
