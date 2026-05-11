import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."settings"
      ADD COLUMN IF NOT EXISTS "catechist_rate_limit_daily_limit" numeric DEFAULT 50;
    ALTER TABLE "payload"."settings"
      DROP COLUMN IF EXISTS "catechist_rate_limit_requests_per_hour";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."settings"
      ADD COLUMN IF NOT EXISTS "catechist_rate_limit_requests_per_hour" numeric DEFAULT 20;
    ALTER TABLE "payload"."settings"
      DROP COLUMN IF EXISTS "catechist_rate_limit_daily_limit";
  `)
}
