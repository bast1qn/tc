import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const searchParams = request.nextUrl.searchParams;
    const plz = searchParams.get('plz');
    const email = searchParams.get('email');

    // Find submission by tracking token
    const submission = await prisma.submission.findUnique({
      where: { trackingToken: token },
      include: {
        files: true,
        bauleitung: { select: { name: true } },
        verantwortlicher: { select: { name: true } },
        gewerk: { select: { name: true } },
        firma: { select: { name: true } },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Link nicht gefunden oder abgelaufen' },
        { status: 404 }
      );
    }

    // If verification data provided, verify PLZ and email
    if (plz && email) {
      if (submission.plz !== plz || submission.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Postleitzahl oder E-Mail-Adresse stimmen nicht überein' },
          { status: 403 }
        );
      }

      // Verification successful - return full submission data
      const statusMapping: Record<string, string> = {
        'OFFEN': 'Offen',
        'IN_BEARBEITUNG': 'In Bearbeitung',
        'ERLEDIGT': 'Erledigt',
        'MAGEL_ABGELEHNT': 'Mangel abgelehnt',
      };

      return NextResponse.json({
        verified: true,
        submission: {
          id: submission.id,
          tcNummer: submission.tcNummer,
          vorname: submission.vorname,
          nachname: submission.nachname,
          strasseHausnummer: submission.strasseHausnummer,
          plz: submission.plz,
          ort: submission.ort,
          email: submission.email,
          telefon: submission.telefon,
          beschreibung: submission.beschreibung,
          haustyp: submission.haustyp,
          bauleitung: submission.bauleitung?.name || null,
          abnahme: submission.abnahme,
          verantwortlicher: submission.verantwortlicher?.name || null,
          gewerk: submission.gewerk?.name || null,
          firma: submission.firma?.name || null,
          status: statusMapping[submission.status] || submission.status,
          ersteFrist: submission.ersteFrist?.toISOString() || null,
          zweiteFrist: submission.zweiteFrist?.toISOString() || null,
          erledigtAm: submission.erledigtAm?.toISOString() || null,
          timestamp: submission.timestamp.toISOString(),
          files: submission.files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            url: f.url,
          })),
        },
      });
    }

    // Return masked data for initial load (pre-verification)
    return NextResponse.json({
      verified: false,
      requiresVerification: true,
      // Only return non-sensitive info for the form
      tcNummer: submission.tcNummer,
    });
  } catch (error) {
    console.error('Tracking API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Daten' },
      { status: 500 }
    );
  }
}
