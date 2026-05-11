import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Rename `payload.sources._is_sample` → `is_sample` to match the field
// renamed in code from `_isSample` to `isSample`. Payload's snake_case
// converter doesn't insert a separator after a leading underscore — the
// runtime SELECT was looking for `_issample` (no dash) which never
// existed, hence the original migration's `_is_sample` was unreachable.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload"."sources" RENAME COLUMN "_is_sample" TO "is_sample";
    EXCEPTION
      WHEN undefined_column THEN NULL;     -- column already named is_sample
      WHEN duplicate_column THEN NULL;     -- both columns exist; leave alone
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload"."sources" RENAME COLUMN "is_sample" TO "_is_sample";
    EXCEPTION
      WHEN undefined_column THEN NULL;
      WHEN duplicate_column THEN NULL;
    END $$;
  `)
}
