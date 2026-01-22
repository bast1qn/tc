import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { Status } from '@prisma/client';
import { put } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {};

    if (status && status !== 'Alle') {
      // Mapping von deutschen Status-Namen zu Enum-Werten
      const statusMapping: Record<string, Status> = {
        'Offen': Status.OFFEN,
        'In Bearbeitung': Status.IN_BEARBEITUNG,
        'Erledigt': Status.ERLEDIGT,
        'Mangel abgelehnt': Status.MAGEL_ABGELEHNT,
      };
      where.status = statusMapping[status];
    }

    if (search) {
      where.OR = [
        { vorname: { contains: search, mode: 'insensitive' } },
        { nachname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { tcNummer: { contains: search, mode: 'insensitive' } },
        { ort: { contains: search, mode: 'insensitive' } },
      ];
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: { files: true },
      orderBy: { [sortBy]: sortOrder },
    });

    // Mapping von Enum-Werten zu deutschen Status-Namen
    const statusReverseMapping: Record<string, string> = {
      'OFFEN': 'Offen',
      'IN_BEARBEITUNG': 'In Bearbeitung',
      'ERLEDIGT': 'Erledigt',
      'MAGEL_ABGELEHNT': 'Mangel abgelehnt',
    };

    // Transform to match frontend types
    const transformed = submissions.map(s => ({
      ...s,
      timestamp: s.timestamp.toISOString(),
      status: statusReverseMapping[s.status] || s.status,
      ersteFrist: s.ersteFrist?.toISOString() || null,
      zweiteFrist: s.zweiteFrist?.toISOString() || null,
      erledigtAm: s.erledigtAm?.toISOString() || null,
      files: s.files.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.url,
        uploadedAt: f.uploadedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ submissions: transformed, total: transformed.length });
  } catch (error) {
    console.error('GET submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const data = {
      vorname: formData.get('vorname') as string,
      nachname: formData.get('nachname') as string,
      strasseHausnummer: formData.get('strasseHausnummer') as string,
      plz: formData.get('plz') as string,
      ort: formData.get('ort') as string,
      tcNummer: formData.get('tcNummer') as string,
      email: formData.get('email') as string,
      telefon: formData.get('telefon') as string,
      beschreibung: formData.get('beschreibung') as string,
      dsgvoAccepted: formData.get('dsgvoAccepted') === 'true',
    };

    // Upload files to Blob Storage
    const files = formData.getAll('files') as File[];
    const uploadedFiles = [];

    for (const file of files) {
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      uploadedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        url: blob.url,
      });
    }

    // Create submission in database
    const submission = await prisma.submission.create({
      data: {
        ...data,
        status: Status.OFFEN,
        files: {
          create: uploadedFiles,
        },
      },
      include: { files: true },
    });

    // Create customer account for tracking
    try {
      const { hash } = await import('bcrypt');
      const tempPassword = generateTempPassword();
      const passwordHash = await hash(tempPassword, 12);

      await prisma.customer.create({
        data: {
          submissionId: submission.id,
          email: submission.email,
          tcNummer: submission.tcNummer,
          passwordHash,
        },
      });

      // Send confirmation email to customer with login credentials
      await fetch(`${request.nextUrl.origin}/api/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: submission.email,
          vorname: submission.vorname,
          nachname: submission.nachname,
          tcNummer: submission.tcNummer,
          tempPassword,
        }),
      });
    } catch (customerError) {
      console.error('Customer account creation failed:', customerError);
      // Don't fail the submission if customer creation fails
    }

    // Send email notification to admin
    try {
      await fetch(`${request.nextUrl.origin}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: submission.timestamp.toISOString(),
          ...data,
          fileNames: uploadedFiles.map(f => f.name),
        }),
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the submission if email fails
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('POST submission error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}

/**
 * Generate a temporary password for new customers
 */
function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
