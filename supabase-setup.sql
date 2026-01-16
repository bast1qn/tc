-- Supabase Setup Script
-- Führen Sie dieses im Supabase Dashboard SQL Editor aus

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "supabaseId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_supabaseId_idx" ON "users"("supabaseId");

-- CreateIndex for ActivityLog
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON "users"
  FOR SELECT USING (auth.uid()::text = "supabaseId");

CREATE POLICY "Admins can view all users" ON "users"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" WHERE "supabaseId" = auth.uid()::text AND "role" = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update users" ON "users"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "users" WHERE "supabaseId" = auth.uid()::text AND "role" = 'ADMIN'
    )
  );

-- RLS Policies for ActivityLog
CREATE POLICY "Admins can view all activity logs" ON "ActivityLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" WHERE "supabaseId" = auth.uid()::text AND "role" = 'ADMIN'
    )
  );
