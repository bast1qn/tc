import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    // Get all submissions
    const submissions = await prisma.submission.findMany({
      select: {
        gewerk: true,
        bauleitung: true,
        firma: true,
      },
    });

    // Count by Gewerk
    const byGewerkMap = new Map<string, number>();
    submissions.forEach((s) => {
      if (s.gewerk) {
        byGewerkMap.set(s.gewerk, (byGewerkMap.get(s.gewerk) || 0) + 1);
      }
    });

    const byGewerk = Array.from(byGewerkMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count by Bauleitung
    const byBauleitungMap = new Map<string, number>();
    submissions.forEach((s) => {
      if (s.bauleitung) {
        byBauleitungMap.set(s.bauleitung, (byBauleitungMap.get(s.bauleitung) || 0) + 1);
      }
    });

    const byBauleitung = Array.from(byBauleitungMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count by Firma (grouped by Gewerk)
    const byFirmaMap = new Map<string, Map<string, number>>(); // gewerk -> (firma -> count)

    submissions.forEach((s) => {
      if (s.firma && s.gewerk) {
        if (!byFirmaMap.has(s.gewerk)) {
          byFirmaMap.set(s.gewerk, new Map());
        }
        const firmaMap = byFirmaMap.get(s.gewerk)!;
        firmaMap.set(s.firma, (firmaMap.get(s.firma) || 0) + 1);
      }
    });

    const byFirma: Array<{ name: string; count: number; gewerk: string }> = [];

    byFirmaMap.forEach((firmaMap, gewerk) => {
      firmaMap.forEach((count, name) => {
        byFirma.push({ name, count, gewerk });
      });
    });

    byFirma.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      byGewerk,
      byBauleitung,
      byFirma,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
