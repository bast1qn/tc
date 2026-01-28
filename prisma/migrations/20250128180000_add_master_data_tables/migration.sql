-- Create Bauleitung table
CREATE TABLE "Bauleitung" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Bauleitung_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Bauleitung_name_key" ON "Bauleitung"("name");
CREATE INDEX "Bauleitung_active_idx" ON "Bauleitung"("active");

-- Create Verantwortlicher table
CREATE TABLE "Verantwortlicher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verantwortlicher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Verantwortlicher_name_key" ON "Verantwortlicher"("name");
CREATE INDEX "Verantwortlicher_active_idx" ON "Verantwortlicher"("active");

-- Create Gewerk table
CREATE TABLE "Gewerk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gewerk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Gewerk_name_key" ON "Gewerk"("name");
CREATE INDEX "Gewerk_active_idx" ON "Gewerk"("active");

-- Create Firma table
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Firma_name_key" ON "Firma"("name");
CREATE INDEX "Firma_active_idx" ON "Firma"("active");

-- Add foreign key columns to Submission table
ALTER TABLE "Submission" ADD COLUMN "bauleitungId" TEXT;
ALTER TABLE "Submission" ADD COLUMN "verantwortlicherId" TEXT;
ALTER TABLE "Submission" ADD COLUMN "gewerkId" TEXT;
ALTER TABLE "Submission" ADD COLUMN "firmaId" TEXT;

-- Create foreign key constraints
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_bauleitungId_fkey" FOREIGN KEY ("bauleitungId") REFERENCES "Bauleitung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_verantwortlicherId_fkey" FOREIGN KEY ("verantwortlicherId") REFERENCES "Verantwortlicher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_gewerkId_fkey" FOREIGN KEY ("gewerkId") REFERENCES "Gewerk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing data from old string columns to new foreign keys
-- Then we'll drop the old columns in a later step if needed, but for now we keep both for compatibility

-- Seed initial master data
-- Bauleitung
INSERT INTO "Bauleitung" (id, name) VALUES
  ('bauleitung-1', 'Daniel Mordass'),
  ('bauleitung-2', 'Jens Kohnert'),
  ('bauleitung-3', 'Markus Wünsch')
ON CONFLICT (name) DO NOTHING;

-- Verantwortlicher
INSERT INTO "Verantwortlicher" (id, name) VALUES
  ('verantwortlicher-1', 'Daniel Mordass'),
  ('verantwortlicher-2', 'Jens Kohnert'),
  ('verantwortlicher-3', 'Markus Wünsch'),
  ('verantwortlicher-4', 'Thomas Wötzel')
ON CONFLICT (name) DO NOTHING;

-- Gewerk
INSERT INTO "Gewerk" (id, name) VALUES
  ('gewerk-1', 'Außenputz'),
  ('gewerk-2', 'Balkone'),
  ('gewerk-3', 'Dachdeckung'),
  ('gewerk-4', 'Dachstuhl'),
  ('gewerk-5', 'Elektro'),
  ('gewerk-6', 'Estrich'),
  ('gewerk-7', 'Fenster'),
  ('gewerk-8', 'Fliesen'),
  ('gewerk-9', 'Heizung/Sanitär'),
  ('gewerk-10', 'Hochbau'),
  ('gewerk-11', 'Innenputz'),
  ('gewerk-12', 'Innentüren'),
  ('gewerk-13', 'Lüftung'),
  ('gewerk-14', 'Tiefbau'),
  ('gewerk-15', 'Treppen'),
  ('gewerk-16', 'Trockenbau')
ON CONFLICT (name) DO NOTHING;

-- Firma
INSERT INTO "Firma" (id, name) VALUES
  ('firma-1', 'Arndt'),
  ('firma-2', 'Bauconstruct'),
  ('firma-3', 'Bauservice Zwenkau'),
  ('firma-4', 'Bergander'),
  ('firma-5', 'BMB'),
  ('firma-6', 'Breman'),
  ('firma-7', 'Cierpinski'),
  ('firma-8', 'Döhler'),
  ('firma-9', 'Enick'),
  ('firma-10', 'Estrichteam'),
  ('firma-11', 'Gaedtke'),
  ('firma-12', 'Guttenberger'),
  ('firma-13', 'Happke'),
  ('firma-14', 'Harrandt'),
  ('firma-15', 'HIB'),
  ('firma-16', 'HIT'),
  ('firma-17', 'Hoppe & Kant'),
  ('firma-18', 'Hüther'),
  ('firma-19', 'Kieburg'),
  ('firma-20', 'Krieg'),
  ('firma-21', 'Lunos'),
  ('firma-22', 'MoJé Bau'),
  ('firma-23', 'Pluggit'),
  ('firma-24', 'Raum + Areal'),
  ('firma-25', 'Salomon'),
  ('firma-26', 'Stoof'),
  ('firma-27', 'Streubel'),
  ('firma-28', 'TMP'),
  ('firma-29', 'Treppenmeister'),
  ('firma-30', 'UDIPAN'),
  ('firma-31', 'Werner')
ON CONFLICT (name) DO NOTHING;

-- Migrate existing Submission data: link existing string values to new foreign keys
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT "id", "bauleitung" FROM "Submission" WHERE "bauleitung" IS NOT NULL
    LOOP
        UPDATE "Submission"
        SET "bauleitungId" = (SELECT "id" FROM "Bauleitung" WHERE "name" = rec."bauleitung" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;

    FOR rec IN SELECT "id", "verantwortlicher" FROM "Submission" WHERE "verantwortlicher" IS NOT NULL
    LOOP
        UPDATE "Submission"
        SET "verantwortlicherId" = (SELECT "id" FROM "Verantwortlicher" WHERE "name" = rec."verantwortlicher" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;

    FOR rec IN SELECT "id", "gewerk" FROM "Submission" WHERE "gewerk" IS NOT NULL
    LOOP
        UPDATE "Submission"
        SET "gewerkId" = (SELECT "id" FROM "Gewerk" WHERE "name" = rec."gewerk" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;

    FOR rec IN SELECT "id", "firma" FROM "Submission" WHERE "firma" IS NOT NULL
    LOOP
        UPDATE "Submission"
        SET "firmaId" = (SELECT "id" FROM "Firma" WHERE "name" = rec."firma" AND "active" = true LIMIT 1)
        WHERE "id" = rec."id";
    END LOOP;
END $$;
