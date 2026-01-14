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
    const { status } = await request.json();

    const statusEnum = status.toUpperCase().replace(' ', '_') as Status;

    const submission = await prisma.submission.update({
      where: { id },
      data: { status: statusEnum },
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
