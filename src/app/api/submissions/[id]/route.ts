import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { del } from '@vercel/blob';
import { Status } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ersteFrist, zweiteFrist, bauleitung, verantwortlicher, gewerk, firma, abnahme } = body;

    const updateData: any = {};

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
      // Wenn Status auf ERLEDIGT gesetzt wird, erledigtAm auf jetzt setzen
      if (statusEnum === Status.ERLEDIGT) {
        updateData.erledigtAm = new Date();
      }
    }

    // Fristen aktualisieren
    if (ersteFrist !== undefined) {
      updateData.ersteFrist = ersteFrist ? new Date(ersteFrist) : null;
    }

    if (zweiteFrist !== undefined) {
      updateData.zweiteFrist = zweiteFrist ? new Date(zweiteFrist) : null;
    }

    // Neue Felder aktualisieren
    if (bauleitung !== undefined) {
      updateData.bauleitung = bauleitung || null;
    }

    if (verantwortlicher !== undefined) {
      updateData.verantwortlicher = verantwortlicher || null;
    }

    if (gewerk !== undefined) {
      updateData.gewerk = gewerk || null;
    }

    if (firma !== undefined) {
      updateData.firma = firma || null;
    }

    if (abnahme !== undefined) {
      updateData.abnahme = abnahme || null;
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
      include: { files: true },
    });

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
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
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
