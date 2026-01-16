import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function POST() {
  try {
    // Prüfen, ob User-Tabelle existiert
    const userTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'User'
      );
    `;

    const tableExists = (userTableExists as any[])[0]?.exists || false;

    if (!tableExists) {
      // Tabelle erstellen
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

        CREATE TABLE "User" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "name" TEXT,
            "role" "UserRole" NOT NULL DEFAULT 'USER',
            "supabaseId" TEXT UNIQUE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
        CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
      `);

      // Admin-User erstellen
      await prisma.user.create({
        data: {
          email: 'admin@townandcountry.de',
          name: 'Admin',
          role: 'ADMIN',
          supabaseId: 'b83e87c9-512d-4918-a9d0-6ee24c0d9187',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Datenbank-Setup erfolgreich! User-Tabelle erstellt und Admin-User angelegt.',
      });
    } else {
      // Prüfen, ob Admin-User existiert
      const existingAdmin = await prisma.user.findUnique({
        where: { supabaseId: 'b83e87c9-512d-4918-a9d0-6ee24c0d9187' },
      });

      if (existingAdmin && existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' },
        });
        return NextResponse.json({
          success: true,
          message: 'Admin-Rechte vergeben!',
        });
      } else if (existingAdmin) {
        return NextResponse.json({
          success: true,
          message: 'Sie sind bereits Admin!',
        });
      } else {
        // Admin erstellen
        await prisma.user.create({
          data: {
            email: 'admin@townandcountry.de',
            name: 'Admin',
            role: 'ADMIN',
            supabaseId: 'b83e87c9-512d-4918-a9d0-6ee24c0d9187',
          },
        });
        return NextResponse.json({
          success: true,
          message: 'Admin-User angelegt!',
        });
      }
    }
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup fehlgeschlagen' },
      { status: 500 }
    );
  }
}
