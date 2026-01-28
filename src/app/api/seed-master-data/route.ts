import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// Initial master data from hardcoded arrays
const INITIAL_DATA = {
  bauleitung: [
    "Daniel Mordass",
    "Jens Kohnert",
    "Markus Wünsch",
  ],
  verantwortlicher: [
    "Daniel Mordass",
    "Jens Kohnert",
    "Markus Wünsch",
    "Thomas Wötzel",
  ],
  gewerk: [
    "Außenputz",
    "Balkone",
    "Dachdeckung",
    "Dachstuhl",
    "Elektro",
    "Estrich",
    "Fenster",
    "Fliesen",
    "Heizung/Sanitär",
    "Hochbau",
    "Innenputz",
    "Innentüren",
    "Lüftung",
    "Tiefbau",
    "Treppen",
    "Trockenbau",
  ],
  firma: [
    "Arndt",
    "Bauconstruct",
    "Bauservice Zwenkau",
    "Bergander",
    "BMB",
    "Breman",
    "Cierpinski",
    "Döhler",
    "Enick",
    "Estrichteam",
    "Gaedtke",
    "Guttenberger",
    "Happke",
    "Harrandt",
    "HIB",
    "HIT",
    "Hoppe & Kant",
    "Hüther",
    "Kieburg",
    "Krieg",
    "Lunos",
    "MoJé Bau",
    "Pluggit",
    "Raum + Areal",
    "Salomon",
    "Stoof",
    "Streubel",
    "TMP",
    "Treppenmeister",
    "UDIPAN",
    "Werner",
  ],
};

export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    // Seed Bauleitung
    for (const name of INITIAL_DATA.bauleitung) {
      const existing = await prisma.bauleitung.findFirst({
        where: { name },
      });
      if (!existing) {
        await prisma.bauleitung.create({ data: { name } });
        created++;
      } else {
        skipped++;
      }
    }

    // Seed Verantwortlicher
    for (const name of INITIAL_DATA.verantwortlicher) {
      const existing = await prisma.verantwortlicher.findFirst({
        where: { name },
      });
      if (!existing) {
        await prisma.verantwortlicher.create({ data: { name } });
        created++;
      } else {
        skipped++;
      }
    }

    // Seed Gewerk
    for (const name of INITIAL_DATA.gewerk) {
      const existing = await prisma.gewerk.findFirst({
        where: { name },
      });
      if (!existing) {
        await prisma.gewerk.create({ data: { name } });
        created++;
      } else {
        skipped++;
      }
    }

    // Seed Firma
    for (const name of INITIAL_DATA.firma) {
      const existing = await prisma.firma.findFirst({
        where: { name },
      });
      if (!existing) {
        await prisma.firma.create({ data: { name } });
        created++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seed completed: ${created} created, ${skipped} already existed`,
    });
  } catch (error) {
    console.error('Seed master data error:', error);
    return NextResponse.json(
      { error: 'Failed to seed master data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if master data exists
  const [bauleitungCount, verantwortlicherCount, gewerkCount, firmaCount] = await Promise.all([
    prisma.bauleitung.count(),
    prisma.verantwortlicher.count(),
    prisma.gewerk.count(),
    prisma.firma.count(),
  ]);

  return NextResponse.json({
    bauleitung: bauleitungCount,
    verantwortlicher: verantwortlicherCount,
    gewerk: gewerkCount,
    firma: firmaCount,
    total: bauleitungCount + verantwortlicherCount + gewerkCount + firmaCount,
  });
}
