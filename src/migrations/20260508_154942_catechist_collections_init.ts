import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Creates the Payload-managed tables for the three new Catechist collections:
// Sources, Concepts (+ synonyms array), CatechistConversations (+ messages array).
//
// Idempotent: every CREATE uses IF NOT EXISTS; enum types use DO/EXCEPTION
// guards so re-running the migration is safe even if dev mode partially
// pushed any of these earlier.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ─── Enum types ────────────────────────────────────────────────────────
    DO $$ BEGIN
      CREATE TYPE "payload"."enum_sources_authority_tier" AS ENUM(
        'scripture','council','catechism','encyclical','father','theologian','other'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "payload"."enum_sources_locator_format" AS ENUM(
        'bible','ccc','roman-catechism','council-canon','encyclical-section','summa','father-book-chapter','generic'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "payload"."enum_sources_ingest_status" AS ENUM(
        'pending','ingesting','ingested','error'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "payload"."enum_concepts_category" AS ENUM(
        'trinity-god','christology','soteriology','sacraments','moral','ecclesiology','eschatology','mariology','spirituality','other'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "payload"."enum_catechist_conversations_messages_role" AS ENUM(
        'user','assistant'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- ─── Sources ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "payload"."sources" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "author" varchar,
      "year" numeric,
      "authority_tier" "payload"."enum_sources_authority_tier" NOT NULL,
      "locator_format" "payload"."enum_sources_locator_format" NOT NULL,
      "file_id" integer NOT NULL,
      "rights_note" varchar,
      "ingest_status" "payload"."enum_sources_ingest_status" DEFAULT 'pending',
      "chunk_count" numeric,
      "last_ingested_at" timestamp(3) with time zone,
      "error_message" varchar,
      "_is_sample" boolean,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "sources_slug_idx" ON "payload"."sources" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "sources_file_idx" ON "payload"."sources" USING btree ("file_id");
    CREATE INDEX IF NOT EXISTS "sources_updated_at_idx" ON "payload"."sources" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "sources_created_at_idx" ON "payload"."sources" USING btree ("created_at");

    -- ─── Concepts ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "payload"."concepts" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "definition" varchar NOT NULL,
      "parent_id" integer,
      "category" "payload"."enum_concepts_category" NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "concepts_slug_idx" ON "payload"."concepts" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "concepts_parent_idx" ON "payload"."concepts" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "concepts_updated_at_idx" ON "payload"."concepts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "concepts_created_at_idx" ON "payload"."concepts" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "payload"."concepts_synonyms" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "phrase" varchar NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "concepts_synonyms_order_idx" ON "payload"."concepts_synonyms" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "concepts_synonyms_parent_id_idx" ON "payload"."concepts_synonyms" USING btree ("_parent_id");

    -- ─── CatechistConversations ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "payload"."catechist_conversations" (
      "id" serial PRIMARY KEY NOT NULL,
      "member_id" integer NOT NULL,
      "title" varchar NOT NULL,
      "archived" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "catechist_conversations_member_idx" ON "payload"."catechist_conversations" USING btree ("member_id");
    CREATE INDEX IF NOT EXISTS "catechist_conversations_archived_idx" ON "payload"."catechist_conversations" USING btree ("archived");
    CREATE INDEX IF NOT EXISTS "catechist_conversations_updated_at_idx" ON "payload"."catechist_conversations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "catechist_conversations_created_at_idx" ON "payload"."catechist_conversations" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "payload"."catechist_conversations_messages" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "role" "payload"."enum_catechist_conversations_messages_role" NOT NULL,
      "content" varchar NOT NULL,
      "citations" jsonb,
      "components" jsonb,
      "created_at" timestamp(3) with time zone NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "catechist_conversations_messages_order_idx" ON "payload"."catechist_conversations_messages" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "catechist_conversations_messages_parent_id_idx" ON "payload"."catechist_conversations_messages" USING btree ("_parent_id");

    -- ─── Foreign keys ──────────────────────────────────────────────────────
    DO $$ BEGIN
      ALTER TABLE "payload"."sources"
        ADD CONSTRAINT "sources_file_id_media_id_fk"
        FOREIGN KEY ("file_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."concepts"
        ADD CONSTRAINT "concepts_parent_id_concepts_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "payload"."concepts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."concepts_synonyms"
        ADD CONSTRAINT "concepts_synonyms_parent_id_concepts_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."concepts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."catechist_conversations"
        ADD CONSTRAINT "catechist_conversations_member_id_members_id_fk"
        FOREIGN KEY ("member_id") REFERENCES "payload"."members"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."catechist_conversations_messages"
        ADD CONSTRAINT "catechist_conversations_messages_parent_id_catechist_conversations_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."catechist_conversations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."catechist_conversations_messages";
    DROP TABLE IF EXISTS "payload"."catechist_conversations";
    DROP TABLE IF EXISTS "payload"."concepts_synonyms";
    DROP TABLE IF EXISTS "payload"."concepts";
    DROP TABLE IF EXISTS "payload"."sources";

    DROP TYPE IF EXISTS "payload"."enum_catechist_conversations_messages_role";
    DROP TYPE IF EXISTS "payload"."enum_concepts_category";
    DROP TYPE IF EXISTS "payload"."enum_sources_ingest_status";
    DROP TYPE IF EXISTS "payload"."enum_sources_locator_format";
    DROP TYPE IF EXISTS "payload"."enum_sources_authority_tier";
  `)
}
