import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Payload's `payload_locked_documents_rels` is a polymorphic FK table that
// must carry one nullable `<collection>_id` column for every collection in
// the config so the studio can track edit locks. When we added Sources,
// Concepts, and CatechistConversations the original collections-init
// migration didn't extend this table — runtime SELECTs from /admin (and
// any code path that calls findGlobal in the admin context) failed with
// `column ... does not exist`. This migration adds the three columns + FKs
// + indexes.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "sources_id" integer,
      ADD COLUMN IF NOT EXISTS "concepts_id" integer,
      ADD COLUMN IF NOT EXISTS "catechist_conversations_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload"."payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_sources_fk"
        FOREIGN KEY ("sources_id") REFERENCES "payload"."sources"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_concepts_fk"
        FOREIGN KEY ("concepts_id") REFERENCES "payload"."concepts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_catechist_conversations_fk"
        FOREIGN KEY ("catechist_conversations_id") REFERENCES "payload"."catechist_conversations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_sources_id_idx"
      ON "payload"."payload_locked_documents_rels" ("sources_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_concepts_id_idx"
      ON "payload"."payload_locked_documents_rels" ("concepts_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_catechist_conversations_id_idx"
      ON "payload"."payload_locked_documents_rels" ("catechist_conversations_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sources_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_concepts_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_catechist_conversations_fk";

    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_sources_id_idx";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_concepts_id_idx";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_catechist_conversations_id_idx";

    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "sources_id",
      DROP COLUMN IF EXISTS "concepts_id",
      DROP COLUMN IF EXISTS "catechist_conversations_id";
  `)
}
