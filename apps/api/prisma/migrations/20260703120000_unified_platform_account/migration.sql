-- Enable UUID generation for backfill ids
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_email_key" ON "PlatformAccount"("email");

-- Add nullable accountId columns first
ALTER TABLE "User" ADD COLUMN "accountId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "accountId" TEXT;

-- Backfill PlatformAccount from User emails (earliest createdAt wins per email)
INSERT INTO "PlatformAccount" ("id", "email", "password", "firstName", "lastName", "phone", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."email",
    u."password",
    NULL,
    NULL,
    NULL,
    MIN(u."createdAt"),
    NOW()
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "PlatformAccount" pa WHERE LOWER(pa."email") = LOWER(u."email")
)
GROUP BY u."email", u."password";

-- Backfill from Customer emails not yet in PlatformAccount
INSERT INTO "PlatformAccount" ("id", "email", "password", "firstName", "lastName", "phone", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    c."email",
    c."password",
    c."firstName",
    c."lastName",
    NULL,
    MIN(c."createdAt"),
    NOW()
FROM "Customer" c
WHERE NOT EXISTS (
    SELECT 1 FROM "PlatformAccount" pa WHERE LOWER(pa."email") = LOWER(c."email")
)
GROUP BY c."email", c."password", c."firstName", c."lastName";

-- Link User rows to PlatformAccount
UPDATE "User" u
SET "accountId" = pa."id"
FROM "PlatformAccount" pa
WHERE LOWER(u."email") = LOWER(pa."email") AND u."accountId" IS NULL;

-- Link Customer rows to PlatformAccount
UPDATE "Customer" c
SET "accountId" = pa."id"
FROM "PlatformAccount" pa
WHERE LOWER(c."email") = LOWER(pa."email") AND c."accountId" IS NULL;

-- For any orphan rows without account (should not happen), create per-row accounts
INSERT INTO "PlatformAccount" ("id", "email", "password", "firstName", "lastName", "phone", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."email",
    u."password",
    NULL,
    NULL,
    NULL,
    u."createdAt",
    NOW()
FROM "User" u
WHERE u."accountId" IS NULL;

UPDATE "User" u
SET "accountId" = pa."id"
FROM "PlatformAccount" pa
WHERE LOWER(u."email") = LOWER(pa."email") AND u."accountId" IS NULL;

INSERT INTO "PlatformAccount" ("id", "email", "password", "firstName", "lastName", "phone", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    c."email",
    c."password",
    c."firstName",
    c."lastName",
    NULL,
    c."createdAt",
    NOW()
FROM "Customer" c
WHERE c."accountId" IS NULL;

UPDATE "Customer" c
SET "accountId" = pa."id"
FROM "PlatformAccount" pa
WHERE LOWER(c."email") = LOWER(pa."email") AND c."accountId" IS NULL;

-- Make accountId required
ALTER TABLE "User" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "accountId" SET NOT NULL;

-- Drop legacy password columns
ALTER TABLE "User" DROP COLUMN "password";
ALTER TABLE "Customer" DROP COLUMN "password";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlatformAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlatformAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "User_accountId_idx" ON "User"("accountId");

-- CreateIndex
CREATE INDEX "Customer_accountId_idx" ON "Customer"("accountId");
