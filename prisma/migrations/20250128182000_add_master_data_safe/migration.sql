-- Master Data Migration - Safe version with full error handling
-- This migration is idempotent and can be run multiple times safely

-- Create Bauleitung table
CREATE TABLE IF NOT EXISTS "_Bauleitung" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "_Bauleitung_pkey" PRIMARY KEY ("id")
);

-- Create unique index only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '_Bauleitung' AND indexname = '_Bauleitung_name_key') THEN
        CREATE UNIQUE INDEX "_Bauleitung_name_key" ON "_Bauleitung"("name");
    END IF;
END $$;

-- Create Verantwortlicher table
CREATE TABLE IF NOT EXISTS "_Verantwortlicher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "_Verantwortlicher_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '_Verantwortlicher' AND indexname = '_Verantwortlicher_name_key') THEN
        CREATE UNIQUE INDEX "_Verantwortlicher_name_key" ON "_Verantwortlicher"("name");
    END IF;
END $$;

-- Create Gewerk table
CREATE TABLE IF NOT EXISTS "_Gewerk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "_Gewerk_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '_Gewerk' AND indexname = '_Gewerk_name_key') THEN
        CREATE UNIQUE INDEX "_Gewerk_name_key" ON "_Gewerk"("name");
    END IF;
END $$;

-- Create Firma table
CREATE TABLE IF NOT EXISTS "_Firma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "_Firma_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '_Firma' AND indexname = '_Firma_name_key') THEN
        CREATE UNIQUE INDEX "_Firma_name_key" ON "_Firma"("name");
    END IF;
END $$;

-- Add foreign key columns to Submission table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Submission' AND column_name = 'bauleitungId') THEN
        ALTER TABLE "Submission" ADD COLUMN "bauleitungId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Submission' AND column_name = 'verantwortlicherId') THEN
        ALTER TABLE "Submission" ADD COLUMN "verantwortlicherId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Submission' AND column_name = 'gewerkId') THEN
        ALTER TABLE "Submission" ADD COLUMN "gewerkId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Submission' AND column_name = 'firmaId') THEN
        ALTER TABLE "Submission" ADD COLUMN "firmaId" TEXT;
    END IF;
END $$;

-- Create foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Submission_bauleitungId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_bauleitungId_fkey" FOREIGN KEY ("bauleitungId") REFERENCES "_Bauleitung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Submission_verantwortlicherId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_verantwortlicherId_fkey" FOREIGN KEY ("verantwortlicherId") REFERENCES "_Verantwortlicher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Submission_gewerkId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_gewerkId_fkey" FOREIGN KEY ("gewerkId") REFERENCES "_Gewerk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Submission_firmaId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "_Firma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Seed Bauleitung data with ON CONFLICT to handle duplicates
INSERT INTO "_Bauleitung" ("id", "name") VALUES
  ('bl-1', 'Daniel Mordass'),
  ('bl-2', 'Jens Kohnert'),
  ('bl-3', 'Markus Wünsch')
ON CONFLICT ("name") DO NOTHING;

-- Seed Verantwortlicher data
INSERT INTO "_Verantwortlicher" ("id", "name") VALUES
  ('vw-1', 'Daniel Mordass'),
  ('vw-2', 'Jens Kohnert'),
  ('vw-3', 'Markus Wünsch'),
  ('vw-4', 'Thomas Wötzel')
ON CONFLICT ("name") DO NOTHING;

-- Seed Gewerk data
INSERT INTO "_Gewerk" ("id", "name") VALUES
  ('gw-1', 'Außenputz'),
  ('gw-2', 'Balkone'),
  ('gw-3', 'Dachdeckung'),
  ('gw-4', 'Dachstuhl'),
  ('gw-5', 'Elektro'),
  ('gw-6', 'Estrich'),
  ('gw-7', 'Fenster'),
  ('gw-8', 'Fliesen'),
  ('gw-9', 'Heizung/Sanitär'),
  ('gw-10', 'Hochbau'),
  ('gw-11', 'Innenputz'),
  ('gw-12', 'Innentüren'),
  ('gw-13', 'Lüftung'),
  ('gw-14', 'Tiefbau'),
  ('gw-15', 'Treppen'),
  ('gw-16', 'Trockenbau')
ON CONFLICT ("name") DO NOTHING;

-- Seed Firma data
INSERT INTO "_Firma" ("id", "name") VALUES
  ('fi-1', 'Arndt'),
  ('fi-2', 'Bauconstruct'),
  ('fi-3', 'Bauservice Zwenkau'),
  ('fi-4', 'Bergander'),
  ('fi-5', 'BMB'),
  ('fi-6', 'Breman'),
  ('fi-7', 'Cierpinski'),
  ('fi-8', 'Döhler'),
  ('fi-9', 'Enick'),
  ('fi-10', 'Estrichteam'),
  ('fi-11', 'Gaedtke'),
  ('fi-12', 'Guttenberger'),
  ('fi-13', 'Happke'),
  ('fi-14', 'Harrandt'),
  ('fi-15', 'HIB'),
  ('fi-16', 'HIT'),
  ('fi-17', 'Hoppe & Kant'),
  ('fi-18', 'Hüther'),
  ('fi-19', 'Kieburg'),
  ('fi-20', 'Krieg'),
  ('fi-21', 'Lunos'),
  ('fi-22', 'MoJé Bau'),
  ('fi-23', 'Pluggit'),
  ('fi-24', 'Raum + Areal'),
  ('fi-25', 'Salomon'),
  ('fi-26', 'Stoof'),
  ('fi-27', 'Streubel'),
  ('fi-28', 'TMP'),
  ('fi-29', 'Treppenmeister'),
  ('fi-30', 'UDIPAN'),
  ('fi-31', 'Werner')
ON CONFLICT ("name") DO NOTHING;
