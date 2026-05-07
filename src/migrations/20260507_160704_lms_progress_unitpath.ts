import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Drop test data — spec §4.3 says "Drop and recreate". No production data exists.
  // Required so we can add unit_path varchar NOT NULL without a default.
  await db.execute(sql`DELETE FROM "payload"."lms_progress";`)
  await db.execute(sql`
   ALTER TABLE "payload"."lms_progress" DROP CONSTRAINT "lms_progress_unit_id_doctrine_units_id_fk";
  
  DROP INDEX "payload"."lms_progress_unit_idx";
  ALTER TABLE "payload"."lms_progress" ALTER COLUMN "mastery_correct" DROP DEFAULT;
  ALTER TABLE "payload"."lms_progress" ALTER COLUMN "last_visited_at" DROP NOT NULL;
  ALTER TABLE "payload"."lms_progress" ADD COLUMN "unit_path" varchar NOT NULL;
  ALTER TABLE "payload"."lms_progress" ADD COLUMN "completed_at" timestamp(3) with time zone;
  CREATE INDEX "lms_progress_unit_path_idx" ON "payload"."lms_progress" USING btree ("unit_path");
  CREATE UNIQUE INDEX "member_unitPath_idx" ON "payload"."lms_progress" USING btree ("member_id","unit_path");
  ALTER TABLE "payload"."lms_progress" DROP COLUMN "unit_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."lms_progress_unit_path_idx";
  DROP INDEX "payload"."member_unitPath_idx";
  ALTER TABLE "payload"."lms_progress" ALTER COLUMN "mastery_correct" SET DEFAULT false;
  ALTER TABLE "payload"."lms_progress" ALTER COLUMN "last_visited_at" SET NOT NULL;
  ALTER TABLE "payload"."lms_progress" ADD COLUMN "unit_id" integer NOT NULL;
  ALTER TABLE "payload"."lms_progress" ADD CONSTRAINT "lms_progress_unit_id_doctrine_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "payload"."doctrine_units"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "lms_progress_unit_idx" ON "payload"."lms_progress" USING btree ("unit_id");
  ALTER TABLE "payload"."lms_progress" DROP COLUMN "unit_path";
  ALTER TABLE "payload"."lms_progress" DROP COLUMN "completed_at";`)
}
