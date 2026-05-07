import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: clean up payload_locked_documents_rels references BEFORE dropping the tables
  // (DROP TABLE CASCADE would remove the FKs first, making the explicit DROP CONSTRAINT fail)
  await db.execute(sql`
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_doctrine_tracks_fk";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_doctrine_modules_fk";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_doctrine_units_fk";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_doctrine_tracks_id_idx";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_doctrine_modules_id_idx";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_doctrine_units_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "doctrine_tracks_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "doctrine_modules_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "doctrine_units_id";`)

  // Step 2: disable RLS and drop the tables
  await db.execute(sql`
  ALTER TABLE "payload"."doctrine_tracks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_doctrine_tracks_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."doctrine_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_doctrine_modules_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."doctrine_units_mastery_check_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."doctrine_units" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_doctrine_units_v_version_mastery_check_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_doctrine_units_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "payload"."doctrine_tracks" CASCADE;
  DROP TABLE IF EXISTS "payload"."_doctrine_tracks_v" CASCADE;
  DROP TABLE IF EXISTS "payload"."doctrine_modules" CASCADE;
  DROP TABLE IF EXISTS "payload"."_doctrine_modules_v" CASCADE;
  DROP TABLE IF EXISTS "payload"."doctrine_units_mastery_check_options" CASCADE;
  DROP TABLE IF EXISTS "payload"."doctrine_units" CASCADE;
  DROP TABLE IF EXISTS "payload"."_doctrine_units_v_version_mastery_check_options" CASCADE;
  DROP TABLE IF EXISTS "payload"."_doctrine_units_v" CASCADE;`)

  // Step 3: drop the enum types
  await db.execute(sql`
  DROP TYPE IF EXISTS "payload"."enum_doctrine_tracks_status";
  DROP TYPE IF EXISTS "payload"."enum__doctrine_tracks_v_version_status";
  DROP TYPE IF EXISTS "payload"."enum_doctrine_modules_status";
  DROP TYPE IF EXISTS "payload"."enum__doctrine_modules_v_version_status";
  DROP TYPE IF EXISTS "payload"."enum_doctrine_units_status";
  DROP TYPE IF EXISTS "payload"."enum__doctrine_units_v_version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_doctrine_tracks_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_tracks_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_doctrine_modules_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_modules_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_doctrine_units_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_units_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."doctrine_tracks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"summary" varchar,
  	"cover_plate_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_og_image_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_doctrine_tracks_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_doctrine_tracks_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_cover_plate_id" integer,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_og_image_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__doctrine_tracks_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."doctrine_modules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"track_id" integer,
  	"title" varchar,
  	"summary" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_og_image_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_doctrine_modules_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_doctrine_modules_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_track_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_og_image_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__doctrine_modules_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."doctrine_units_mastery_check_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false,
  	"affirmation" varchar
  );
  
  CREATE TABLE "payload"."doctrine_units" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"module_id" integer,
  	"title" varchar,
  	"introduction" jsonb,
  	"lanes_reading" jsonb,
  	"lanes_watch_video_id" integer,
  	"lanes_listen_audio_id" integer,
  	"mastery_check_prompt" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_og_image_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_doctrine_units_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_doctrine_units_v_version_mastery_check_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false,
  	"affirmation" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_doctrine_units_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_module_id" integer,
  	"version_title" varchar,
  	"version_introduction" jsonb,
  	"version_lanes_reading" jsonb,
  	"version_lanes_watch_video_id" integer,
  	"version_lanes_listen_audio_id" integer,
  	"version_mastery_check_prompt" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_og_image_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__doctrine_units_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "doctrine_tracks_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "doctrine_modules_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "doctrine_units_id" integer;
  ALTER TABLE "payload"."doctrine_tracks" ADD CONSTRAINT "doctrine_tracks_cover_plate_id_media_id_fk" FOREIGN KEY ("cover_plate_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_tracks" ADD CONSTRAINT "doctrine_tracks_meta_og_image_id_media_id_fk" FOREIGN KEY ("meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_tracks_v" ADD CONSTRAINT "_doctrine_tracks_v_parent_id_doctrine_tracks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."doctrine_tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_tracks_v" ADD CONSTRAINT "_doctrine_tracks_v_version_cover_plate_id_media_id_fk" FOREIGN KEY ("version_cover_plate_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_tracks_v" ADD CONSTRAINT "_doctrine_tracks_v_version_meta_og_image_id_media_id_fk" FOREIGN KEY ("version_meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_modules" ADD CONSTRAINT "doctrine_modules_track_id_doctrine_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "payload"."doctrine_tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_modules" ADD CONSTRAINT "doctrine_modules_meta_og_image_id_media_id_fk" FOREIGN KEY ("meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_modules_v" ADD CONSTRAINT "_doctrine_modules_v_parent_id_doctrine_modules_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."doctrine_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_modules_v" ADD CONSTRAINT "_doctrine_modules_v_version_track_id_doctrine_tracks_id_fk" FOREIGN KEY ("version_track_id") REFERENCES "payload"."doctrine_tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_modules_v" ADD CONSTRAINT "_doctrine_modules_v_version_meta_og_image_id_media_id_fk" FOREIGN KEY ("version_meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_units_mastery_check_options" ADD CONSTRAINT "doctrine_units_mastery_check_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."doctrine_units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_units" ADD CONSTRAINT "doctrine_units_module_id_doctrine_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "payload"."doctrine_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_units" ADD CONSTRAINT "doctrine_units_lanes_watch_video_id_media_id_fk" FOREIGN KEY ("lanes_watch_video_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_units" ADD CONSTRAINT "doctrine_units_lanes_listen_audio_id_media_id_fk" FOREIGN KEY ("lanes_listen_audio_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_units" ADD CONSTRAINT "doctrine_units_meta_og_image_id_media_id_fk" FOREIGN KEY ("meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_units_v_version_mastery_check_options" ADD CONSTRAINT "_doctrine_units_v_version_mastery_check_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_doctrine_units_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_units_v" ADD CONSTRAINT "_doctrine_units_v_parent_id_doctrine_units_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."doctrine_units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_units_v" ADD CONSTRAINT "_doctrine_units_v_version_module_id_doctrine_modules_id_fk" FOREIGN KEY ("version_module_id") REFERENCES "payload"."doctrine_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_units_v" ADD CONSTRAINT "_doctrine_units_v_version_lanes_watch_video_id_media_id_fk" FOREIGN KEY ("version_lanes_watch_video_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_units_v" ADD CONSTRAINT "_doctrine_units_v_version_lanes_listen_audio_id_media_id_fk" FOREIGN KEY ("version_lanes_listen_audio_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_units_v" ADD CONSTRAINT "_doctrine_units_v_version_meta_og_image_id_media_id_fk" FOREIGN KEY ("version_meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "doctrine_tracks_cover_plate_idx" ON "payload"."doctrine_tracks" USING btree ("cover_plate_id");
  CREATE INDEX "doctrine_tracks_meta_meta_og_image_idx" ON "payload"."doctrine_tracks" USING btree ("meta_og_image_id");
  CREATE UNIQUE INDEX "doctrine_tracks_slug_idx" ON "payload"."doctrine_tracks" USING btree ("slug");
  CREATE INDEX "doctrine_tracks_updated_at_idx" ON "payload"."doctrine_tracks" USING btree ("updated_at");
  CREATE INDEX "doctrine_tracks_created_at_idx" ON "payload"."doctrine_tracks" USING btree ("created_at");
  CREATE INDEX "doctrine_tracks__status_idx" ON "payload"."doctrine_tracks" USING btree ("_status");
  CREATE INDEX "_doctrine_tracks_v_parent_idx" ON "payload"."_doctrine_tracks_v" USING btree ("parent_id");
  CREATE INDEX "_doctrine_tracks_v_version_version_cover_plate_idx" ON "payload"."_doctrine_tracks_v" USING btree ("version_cover_plate_id");
  CREATE INDEX "_doctrine_tracks_v_version_meta_version_meta_og_image_idx" ON "payload"."_doctrine_tracks_v" USING btree ("version_meta_og_image_id");
  CREATE INDEX "_doctrine_tracks_v_version_version_slug_idx" ON "payload"."_doctrine_tracks_v" USING btree ("version_slug");
  CREATE INDEX "_doctrine_tracks_v_version_version_updated_at_idx" ON "payload"."_doctrine_tracks_v" USING btree ("version_updated_at");
  CREATE INDEX "_doctrine_tracks_v_version_version_created_at_idx" ON "payload"."_doctrine_tracks_v" USING btree ("version_created_at");
  CREATE INDEX "_doctrine_tracks_v_version_version__status_idx" ON "payload"."_doctrine_tracks_v" USING btree ("version__status");
  CREATE INDEX "_doctrine_tracks_v_created_at_idx" ON "payload"."_doctrine_tracks_v" USING btree ("created_at");
  CREATE INDEX "_doctrine_tracks_v_updated_at_idx" ON "payload"."_doctrine_tracks_v" USING btree ("updated_at");
  CREATE INDEX "_doctrine_tracks_v_latest_idx" ON "payload"."_doctrine_tracks_v" USING btree ("latest");
  CREATE INDEX "_doctrine_tracks_v_autosave_idx" ON "payload"."_doctrine_tracks_v" USING btree ("autosave");
  CREATE INDEX "doctrine_modules_track_idx" ON "payload"."doctrine_modules" USING btree ("track_id");
  CREATE INDEX "doctrine_modules_meta_meta_og_image_idx" ON "payload"."doctrine_modules" USING btree ("meta_og_image_id");
  CREATE INDEX "doctrine_modules_slug_idx" ON "payload"."doctrine_modules" USING btree ("slug");
  CREATE INDEX "doctrine_modules_updated_at_idx" ON "payload"."doctrine_modules" USING btree ("updated_at");
  CREATE INDEX "doctrine_modules_created_at_idx" ON "payload"."doctrine_modules" USING btree ("created_at");
  CREATE INDEX "doctrine_modules__status_idx" ON "payload"."doctrine_modules" USING btree ("_status");
  CREATE INDEX "_doctrine_modules_v_parent_idx" ON "payload"."_doctrine_modules_v" USING btree ("parent_id");
  CREATE INDEX "_doctrine_modules_v_version_version_track_idx" ON "payload"."_doctrine_modules_v" USING btree ("version_track_id");
  CREATE INDEX "_doctrine_modules_v_version_meta_version_meta_og_image_idx" ON "payload"."_doctrine_modules_v" USING btree ("version_meta_og_image_id");
  CREATE INDEX "_doctrine_modules_v_version_version_slug_idx" ON "payload"."_doctrine_modules_v" USING btree ("version_slug");
  CREATE INDEX "_doctrine_modules_v_version_version_updated_at_idx" ON "payload"."_doctrine_modules_v" USING btree ("version_updated_at");
  CREATE INDEX "_doctrine_modules_v_version_version_created_at_idx" ON "payload"."_doctrine_modules_v" USING btree ("version_created_at");
  CREATE INDEX "_doctrine_modules_v_version_version__status_idx" ON "payload"."_doctrine_modules_v" USING btree ("version__status");
  CREATE INDEX "_doctrine_modules_v_created_at_idx" ON "payload"."_doctrine_modules_v" USING btree ("created_at");
  CREATE INDEX "_doctrine_modules_v_updated_at_idx" ON "payload"."_doctrine_modules_v" USING btree ("updated_at");
  CREATE INDEX "_doctrine_modules_v_latest_idx" ON "payload"."_doctrine_modules_v" USING btree ("latest");
  CREATE INDEX "_doctrine_modules_v_autosave_idx" ON "payload"."_doctrine_modules_v" USING btree ("autosave");
  CREATE INDEX "doctrine_units_mastery_check_options_order_idx" ON "payload"."doctrine_units_mastery_check_options" USING btree ("_order");
  CREATE INDEX "doctrine_units_mastery_check_options_parent_id_idx" ON "payload"."doctrine_units_mastery_check_options" USING btree ("_parent_id");
  CREATE INDEX "doctrine_units_module_idx" ON "payload"."doctrine_units" USING btree ("module_id");
  CREATE INDEX "doctrine_units_lanes_lanes_watch_video_idx" ON "payload"."doctrine_units" USING btree ("lanes_watch_video_id");
  CREATE INDEX "doctrine_units_lanes_lanes_listen_audio_idx" ON "payload"."doctrine_units" USING btree ("lanes_listen_audio_id");
  CREATE INDEX "doctrine_units_meta_meta_og_image_idx" ON "payload"."doctrine_units" USING btree ("meta_og_image_id");
  CREATE INDEX "doctrine_units_slug_idx" ON "payload"."doctrine_units" USING btree ("slug");
  CREATE INDEX "doctrine_units_updated_at_idx" ON "payload"."doctrine_units" USING btree ("updated_at");
  CREATE INDEX "doctrine_units_created_at_idx" ON "payload"."doctrine_units" USING btree ("created_at");
  CREATE INDEX "doctrine_units__status_idx" ON "payload"."doctrine_units" USING btree ("_status");
  CREATE INDEX "_doctrine_units_v_version_mastery_check_options_order_idx" ON "payload"."_doctrine_units_v_version_mastery_check_options" USING btree ("_order");
  CREATE INDEX "_doctrine_units_v_version_mastery_check_options_parent_id_idx" ON "payload"."_doctrine_units_v_version_mastery_check_options" USING btree ("_parent_id");
  CREATE INDEX "_doctrine_units_v_parent_idx" ON "payload"."_doctrine_units_v" USING btree ("parent_id");
  CREATE INDEX "_doctrine_units_v_version_version_module_idx" ON "payload"."_doctrine_units_v" USING btree ("version_module_id");
  CREATE INDEX "_doctrine_units_v_version_lanes_version_lanes_watch_vide_idx" ON "payload"."_doctrine_units_v" USING btree ("version_lanes_watch_video_id");
  CREATE INDEX "_doctrine_units_v_version_lanes_version_lanes_listen_aud_idx" ON "payload"."_doctrine_units_v" USING btree ("version_lanes_listen_audio_id");
  CREATE INDEX "_doctrine_units_v_version_meta_version_meta_og_image_idx" ON "payload"."_doctrine_units_v" USING btree ("version_meta_og_image_id");
  CREATE INDEX "_doctrine_units_v_version_version_slug_idx" ON "payload"."_doctrine_units_v" USING btree ("version_slug");
  CREATE INDEX "_doctrine_units_v_version_version_updated_at_idx" ON "payload"."_doctrine_units_v" USING btree ("version_updated_at");
  CREATE INDEX "_doctrine_units_v_version_version_created_at_idx" ON "payload"."_doctrine_units_v" USING btree ("version_created_at");
  CREATE INDEX "_doctrine_units_v_version_version__status_idx" ON "payload"."_doctrine_units_v" USING btree ("version__status");
  CREATE INDEX "_doctrine_units_v_created_at_idx" ON "payload"."_doctrine_units_v" USING btree ("created_at");
  CREATE INDEX "_doctrine_units_v_updated_at_idx" ON "payload"."_doctrine_units_v" USING btree ("updated_at");
  CREATE INDEX "_doctrine_units_v_latest_idx" ON "payload"."_doctrine_units_v" USING btree ("latest");
  CREATE INDEX "_doctrine_units_v_autosave_idx" ON "payload"."_doctrine_units_v" USING btree ("autosave");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_tracks_fk" FOREIGN KEY ("doctrine_tracks_id") REFERENCES "payload"."doctrine_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_modules_fk" FOREIGN KEY ("doctrine_modules_id") REFERENCES "payload"."doctrine_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_units_fk" FOREIGN KEY ("doctrine_units_id") REFERENCES "payload"."doctrine_units"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_doctrine_tracks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_tracks_id");
  CREATE INDEX "payload_locked_documents_rels_doctrine_modules_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_modules_id");
  CREATE INDEX "payload_locked_documents_rels_doctrine_units_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_units_id");`)
}
