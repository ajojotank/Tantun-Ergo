import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Drop the NOT NULL constraint on payload.sources.file_id so a Source can
// be programmatically seeded without going through the Studio's file
// upload flow (used by scripts/seed-test-source.ts to give the Catechist a
// quick test corpus). The file relationship itself stays — production
// sources still upload PDFs/DOCX as before.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."sources" ALTER COLUMN "file_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Cannot safely re-add NOT NULL when there are rows with NULL file_id;
  // the down path is best-effort.
  await db.execute(sql`
    DELETE FROM "payload"."sources" WHERE "file_id" IS NULL;
    ALTER TABLE "payload"."sources" ALTER COLUMN "file_id" SET NOT NULL;
  `)
}
