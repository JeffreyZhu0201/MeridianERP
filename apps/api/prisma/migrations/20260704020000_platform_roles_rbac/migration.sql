-- Migrate PLATFORM_OPS to REVIEWER and replace PlatformRole enum

CREATE TYPE "PlatformRole_new" AS ENUM ('SUPER_ADMIN', 'FINANCE', 'FULFILLMENT', 'REVIEWER');

ALTER TABLE "PlatformUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "PlatformUser"
  ALTER COLUMN "role" TYPE "PlatformRole_new"
  USING (
    CASE "role"::text
      WHEN 'PLATFORM_OPS' THEN 'REVIEWER'::"PlatformRole_new"
      ELSE "role"::text::"PlatformRole_new"
    END
  );

DROP TYPE "PlatformRole";
ALTER TYPE "PlatformRole_new" RENAME TO "PlatformRole";
