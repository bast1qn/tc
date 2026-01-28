-- Create Bauleitung table
CREATE TABLE IF NOT EXISTS "Bauleitung" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Bauleitung_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Bauleitung_name_key" ON "Bauleitung"("name");
CREATE INDEX IF NOT EXISTS "Bauleitung_active_idx" ON "Bauleitung"("active");

-- Create Verantwortlicher table
CREATE TABLE IF NOT EXISTS "Verantwortlicher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verantwortlicher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Verantwortlicher_name_key" ON "Verantwortlicher"("name");
CREATE INDEX IF NOT EXISTS "Verantwortlicher_active_idx" ON "Verantwortlicher"("active");

-- Create Gewerk table
CREATE TABLE IF NOT EXISTS "Gewerk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gewerk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Gewerk_name_key" ON "Gewerk"("name");
CREATE INDEX IF NOT EXISTS "Gewerk_active_idx" ON "Gewerk"("active");

-- Create Firma table
CREATE TABLE IF NOT EXISTS "Firma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Firma_name_key" ON "Firma"("name");
CREATE INDEX IF NOT EXISTS "Firma_active_idx" ON "Firma"("active");

-- Add foreign key columns to Submission table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "information_schema"."columns" WHERE "table_name" = 'Submission' AND "column_name" = 'bauleitungId') THEN
        ALTER TABLE "Submission" ADD COLUMN "bauleitungId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "information_schema"."columns" WHERE "table_name" = 'Submission' AND "column_name" = 'verantwortlicherId') THEN
        ALTER TABLE "Submission" ADD COLUMN "verantwortlicherId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "information_schema"."columns" WHERE "table_name" = 'Submission' AND "column_name" = 'gewerkId') THEN
        ALTER TABLE "Submission" ADD COLUMN "gewerkId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "information_schema"."columns" WHERE "table_name" = 'Submission' AND "column_name" = 'firmaId') THEN
        ALTER TABLE "Submission" ADD COLUMN "firmaId" TEXT;
    END IF;
END $$;

-- Create foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Submission_bauleitungId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_bauleitungId_fkey" FOREIGN KEY ("bauleitungId") REFERENCES "Bauleitung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Submission_verantwortlicherId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_verantwortlicherId_fkey" FOREIGN KEY ("verantwortlicherId") REFERENCES "Verantwortlicher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Submission_gewerkId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_gewerkId_fkey" FOREIGN KEY ("gewerkId") REFERENCES "Gewerk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'Submission_firmaId_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Seed initial master data with INSERT ... ON CONFLICT DO NOTHING
INSERT INTO "Bauleitung" ("id", "name") VALUES
  ('bl-1', 'Daniel Mordass'),
  ('bl-2', 'Jens Kohnert'),
  ('bl-3', 'Markus Wünsch')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Verantwortlicher" ("id", "name") VALUES
  ('vw-1', 'Daniel Mordass'),
  ('vw-2', 'Jens Kohnert'),
  ('vw-3', 'Markus Wünsch'),
  ('vw-4', 'Thomas Wötzel')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Gewerk" ("id", "name") VALUES
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

INSERT INTO "Firma" ("id", "name") VALUES
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

-- Migrate existing Submission data: link existing string values to new foreign keys
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT "id", "bauleitung" FROM "Submission" WHERE "bauleitung" IS NOT NULL AND "bauleitungId" IS NULL
    LOOP
        UPDATE "Submission"
        SET "bauleitungId" = (SELECT "id" FROM "Bauleitung" WHERE "name" = rec."bauleitung" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;

    FOR rec IN SELECT "id", "verantwortlicher" FROM "Submission" WHERE "verantwortlicher" IS NOT NULL AND "verantwortlicherId" IS NULL
    LOOP
        UPDATE "Submission"
        SET "verantwortlicherId" = (SELECT "id" FROM "Verantwortlicher" WHERE "name" = rec."verantwortlicher" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;

    FOR rec IN SELECT "id", "gewerk" FROM "Submission" WHERE "gewerk" IS NOT NULL AND "gewerkId" IS NULL
    LOOP
        UPDATE "Submission"
        SET "gewerkId" = (SELECT "id" FROM "Gewerk" WHERE "name" = rec."gewerk" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;

    FOR rec IN SELECT "id", "firma" FROM "Submission" WHERE "firma" IS NOT NULL AND "firmaId" IS NULL
    LOOP
        UPDATE "Submission"
        SET "firmaId" = (SELECT "id" FROM "Firma" WHERE "name" = rec."firma" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;
END $$;
