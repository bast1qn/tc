import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    // Get all submissions with relations
    const submissions = await prisma.submission.findMany({
      select: {
        gewerk: {
          select: { name: true },
        },
        bauleitung: {
          select: { name: true },
        },
        firma: {
          select: { name: true },
        },
      },
    });

    // Count by Gewerk
    const byGewerkMap = new Map<string, number>();
    submissions.forEach((s) => {
      if (s.gewerk) {
        const name = s.gewerk.name;
        byGewerkMap.set(name, (byGewerkMap.get(name) || 0) + 1);
      }
    });

    const byGewerk = Array.from(byGewerkMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count by Bauleitung
    const byBauleitungMap = new Map<string, number>();
    submissions.forEach((s) => {
      if (s.bauleitung) {
        const name = s.bauleitung.name;
        byBauleitungMap.set(name, (byBauleitungMap.get(name) || 0) + 1);
      }
    });

    const byBauleitung = Array.from(byBauleitungMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count by Firma (grouped by Gewerk)
    const byFirmaMap = new Map<string, Map<string, number>>(); // gewerk -> (firma -> count)

    submissions.forEach((s) => {
      if (s.firma && s.gewerk) {
        const gewerkName = s.gewerk.name;
        const firmaName = s.firma.name;
        if (!byFirmaMap.has(gewerkName)) {
          byFirmaMap.set(gewerkName, new Map());
        }
        const firmaMap = byFirmaMap.get(gewerkName)!;
        firmaMap.set(firmaName, (firmaMap.get(firmaName) || 0) + 1);
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
