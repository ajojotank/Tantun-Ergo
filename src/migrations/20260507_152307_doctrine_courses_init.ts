import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'theologian', 'editor');
  CREATE TYPE "payload"."enum_members_roles" AS ENUM('admin', 'instructor', 'learner');
  CREATE TYPE "payload"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_miracles_type" AS ENUM('eucharistic', 'marian', 'healing', 'stigmata', 'incorruptible', 'other');
  CREATE TYPE "payload"."enum_miracles_ecclesial_status" AS ENUM('approved', 'recognised', 'worthy-of-belief', 'under-investigation', 'not-constatat');
  CREATE TYPE "payload"."enum_miracles_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__miracles_v_version_type" AS ENUM('eucharistic', 'marian', 'healing', 'stigmata', 'incorruptible', 'other');
  CREATE TYPE "payload"."enum__miracles_v_version_ecclesial_status" AS ENUM('approved', 'recognised', 'worthy-of-belief', 'under-investigation', 'not-constatat');
  CREATE TYPE "payload"."enum__miracles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_pilgrimages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pilgrimages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_doctrine_courses_modules_units_resources_kind" AS ENUM('download', 'link', 'citation');
  CREATE TYPE "payload"."enum_doctrine_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_courses_v_version_modules_units_resources_kind" AS ENUM('download', 'link', 'citation');
  CREATE TYPE "payload"."enum__doctrine_courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_doctrine_tracks_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_tracks_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_doctrine_modules_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_modules_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_doctrine_units_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__doctrine_units_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "payload"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "payload"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "payload"."enum_settings_socials_platform" AS ENUM('x', 'instagram', 'youtube', 'email');
  CREATE TYPE "payload"."enum_home_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_manifesto_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__manifesto_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_credits_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__credits_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"bio" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."members_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_members_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."members_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"avatar_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"attribution" varchar,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_sequence_url" varchar,
  	"sizes_sequence_width" numeric,
  	"sizes_sequence_height" numeric,
  	"sizes_sequence_mime_type" varchar,
  	"sizes_sequence_filesize" numeric,
  	"sizes_sequence_filename" varchar
  );
  
  CREATE TABLE "payload"."articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"excerpt" varchar,
  	"hero_eyebrow" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_og_image_id" integer,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_excerpt" varchar,
  	"version_hero_eyebrow" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_og_image_id" integer,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."miracles_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"attribution" varchar
  );
  
  CREATE TABLE "payload"."miracles_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"label" varchar,
  	"attribution" varchar
  );
  
  CREATE TABLE "payload"."miracles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"summary" varchar,
  	"narrative" jsonb,
  	"type" "payload"."enum_miracles_type",
  	"ecclesial_status" "payload"."enum_miracles_ecclesial_status",
  	"location_name" varchar,
  	"coordinates" geometry(Point),
  	"year_occurred" numeric,
  	"date_approximate" boolean DEFAULT false,
  	"approval_date" timestamp(3) with time zone,
  	"approving_authority" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_og_image_id" integer,
  	"slug" varchar,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_miracles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."miracles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "payload"."_miracles_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"attribution" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_miracles_v_version_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"label" varchar,
  	"attribution" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_miracles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_narrative" jsonb,
  	"version_type" "payload"."enum__miracles_v_version_type",
  	"version_ecclesial_status" "payload"."enum__miracles_v_version_ecclesial_status",
  	"version_location_name" varchar,
  	"version_coordinates" geometry(Point),
  	"version_year_occurred" numeric,
  	"version_date_approximate" boolean DEFAULT false,
  	"version_approval_date" timestamp(3) with time zone,
  	"version_approving_authority" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_og_image_id" integer,
  	"version_slug" varchar,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__miracles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_miracles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "payload"."pilgrimages_route" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"miracle_id" integer,
  	"chapter_note" varchar
  );
  
  CREATE TABLE "payload"."pilgrimages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"intro" varchar,
  	"cover_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_og_image_id" integer,
  	"slug" varchar,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_pilgrimages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_pilgrimages_v_version_route" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"miracle_id" integer,
  	"chapter_note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pilgrimages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_intro" varchar,
  	"version_cover_image_id" integer,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_og_image_id" integer,
  	"version_slug" varchar,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pilgrimages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."doctrine_courses_learn_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" varchar
  );
  
  CREATE TABLE "payload"."doctrine_courses_modules_units_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"kind" "payload"."enum_doctrine_courses_modules_units_resources_kind" DEFAULT 'link',
  	"file_id" integer,
  	"url" varchar,
  	"citation" varchar,
  	"citation_url" varchar
  );
  
  CREATE TABLE "payload"."doctrine_courses_modules_units_mastery_check_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false,
  	"affirmation" varchar
  );
  
  CREATE TABLE "payload"."doctrine_courses_modules_units" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"estimated_minutes" numeric DEFAULT 5,
  	"introduction" jsonb,
  	"lanes_reading" jsonb,
  	"lanes_watch_video_id" integer,
  	"lanes_listen_audio_id" integer,
  	"mastery_check_prompt" varchar
  );
  
  CREATE TABLE "payload"."doctrine_courses_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar
  );
  
  CREATE TABLE "payload"."doctrine_courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"tagline" varchar,
  	"summary" varchar,
  	"long_description" jsonb,
  	"cover_plate_id" integer,
  	"order" numeric DEFAULT 0,
  	"_issample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_doctrine_courses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."doctrine_courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v_version_learn_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v_version_modules_units_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"kind" "payload"."enum__doctrine_courses_v_version_modules_units_resources_kind" DEFAULT 'link',
  	"file_id" integer,
  	"url" varchar,
  	"citation" varchar,
  	"citation_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v_version_modules_units_mastery_check_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false,
  	"affirmation" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v_version_modules_units" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"estimated_minutes" numeric DEFAULT 5,
  	"introduction" jsonb,
  	"lanes_reading" jsonb,
  	"lanes_watch_video_id" integer,
  	"lanes_listen_audio_id" integer,
  	"mastery_check_prompt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v_version_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_tagline" varchar,
  	"version_summary" varchar,
  	"version_long_description" jsonb,
  	"version_cover_plate_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version__issample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__doctrine_courses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_doctrine_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer
  );
  
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
  
  CREATE TABLE "payload"."lms_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"member_id" integer NOT NULL,
  	"unit_id" integer NOT NULL,
  	"mastery_answer" varchar,
  	"mastery_correct" boolean DEFAULT false,
  	"last_visited_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "payload"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "payload"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "payload"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"members_id" integer,
  	"media_id" integer,
  	"articles_id" integer,
  	"miracles_id" integer,
  	"pilgrimages_id" integer,
  	"doctrine_courses_id" integer,
  	"doctrine_tracks_id" integer,
  	"doctrine_modules_id" integer,
  	"doctrine_units_id" integer,
  	"lms_progress_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"members_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_settings_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar DEFAULT 'Tantum Ergo' NOT NULL,
  	"site_tagline" varchar DEFAULT 'A digital Sistine Chapel for Catholic formation.',
  	"footer_copy" jsonb,
  	"brand_logo_id" integer,
  	"brand_favicon_light_id" integer,
  	"brand_favicon_dark_id" integer,
  	"mapbox_style" varchar,
  	"catechist_rate_limit_requests_per_hour" numeric DEFAULT 20 NOT NULL,
  	"catechist_rate_limit_refusal_message" varchar DEFAULT 'You''ve asked many questions in a short time. Please rest and return shortly.',
  	"show_sample_badges" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."home_page_manifesto_sequence_frames" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"caption" jsonb,
  	"image_id" integer
  );
  
  CREATE TABLE "payload"."home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar DEFAULT 'In Hoc Signo · MMXXVI',
  	"hero_headline_line1" varchar DEFAULT 'A digital',
  	"hero_headline_italic" varchar DEFAULT 'Sistine Chapel',
  	"hero_headline_line2" varchar DEFAULT 'for Catholic formation.',
  	"hero_subheadline" varchar DEFAULT 'Tantum Ergo holds three instruments inside one reverent surface — a cartographic Miracle Atlas, a long-form Doctrine LMS, and an AI Catechist bound to citation. Mobile-first. Scroll-scrubbed. Built to last centuries.',
  	"hero_cta_primary_label" varchar DEFAULT 'Begin pilgrimage',
  	"hero_cta_primary_href" varchar DEFAULT '/atlas',
  	"hero_cta_secondary_label" varchar DEFAULT 'Read the manifesto',
  	"hero_cta_secondary_href" varchar DEFAULT '/manifesto',
  	"hero_image_id" integer,
  	"manifesto_sequence_enabled" boolean DEFAULT true,
  	"pillars_eyebrow" varchar DEFAULT 'Three pillars',
  	"pillars_headline_line1" varchar DEFAULT 'Cartography. Formation.',
  	"pillars_headline_italic" varchar DEFAULT 'Dialogue.',
  	"pillars_atlas_title" varchar DEFAULT 'Atlas',
  	"pillars_atlas_intent" varchar DEFAULT 'A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record.',
  	"pillars_atlas_href" varchar DEFAULT '/atlas',
  	"pillars_atlas_image_id" integer,
  	"pillars_doctrine_title" varchar DEFAULT 'Doctrine',
  	"pillars_doctrine_intent" varchar DEFAULT 'A breviary-paced LMS over councils, encyclicals, the Catechism.',
  	"pillars_doctrine_href" varchar DEFAULT '/doctrine',
  	"pillars_doctrine_image_id" integer,
  	"pillars_catechist_title" varchar DEFAULT 'Catechist',
  	"pillars_catechist_intent" varchar DEFAULT 'An interlocutor bound to citation. Cites; never invents.',
  	"pillars_catechist_href" varchar DEFAULT '/catechist',
  	"pillars_catechist_image_id" integer,
  	"reading_band_eyebrow" varchar DEFAULT 'From the reading room',
  	"reading_band_empty_message" varchar DEFAULT 'Reading room opens soon.',
  	"reading_band_limit" numeric DEFAULT 6,
  	"_status" "payload"."enum_home_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_home_page_v_version_manifesto_sequence_frames" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"caption" jsonb,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_eyebrow" varchar DEFAULT 'In Hoc Signo · MMXXVI',
  	"version_hero_headline_line1" varchar DEFAULT 'A digital',
  	"version_hero_headline_italic" varchar DEFAULT 'Sistine Chapel',
  	"version_hero_headline_line2" varchar DEFAULT 'for Catholic formation.',
  	"version_hero_subheadline" varchar DEFAULT 'Tantum Ergo holds three instruments inside one reverent surface — a cartographic Miracle Atlas, a long-form Doctrine LMS, and an AI Catechist bound to citation. Mobile-first. Scroll-scrubbed. Built to last centuries.',
  	"version_hero_cta_primary_label" varchar DEFAULT 'Begin pilgrimage',
  	"version_hero_cta_primary_href" varchar DEFAULT '/atlas',
  	"version_hero_cta_secondary_label" varchar DEFAULT 'Read the manifesto',
  	"version_hero_cta_secondary_href" varchar DEFAULT '/manifesto',
  	"version_hero_image_id" integer,
  	"version_manifesto_sequence_enabled" boolean DEFAULT true,
  	"version_pillars_eyebrow" varchar DEFAULT 'Three pillars',
  	"version_pillars_headline_line1" varchar DEFAULT 'Cartography. Formation.',
  	"version_pillars_headline_italic" varchar DEFAULT 'Dialogue.',
  	"version_pillars_atlas_title" varchar DEFAULT 'Atlas',
  	"version_pillars_atlas_intent" varchar DEFAULT 'A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record.',
  	"version_pillars_atlas_href" varchar DEFAULT '/atlas',
  	"version_pillars_atlas_image_id" integer,
  	"version_pillars_doctrine_title" varchar DEFAULT 'Doctrine',
  	"version_pillars_doctrine_intent" varchar DEFAULT 'A breviary-paced LMS over councils, encyclicals, the Catechism.',
  	"version_pillars_doctrine_href" varchar DEFAULT '/doctrine',
  	"version_pillars_doctrine_image_id" integer,
  	"version_pillars_catechist_title" varchar DEFAULT 'Catechist',
  	"version_pillars_catechist_intent" varchar DEFAULT 'An interlocutor bound to citation. Cites; never invents.',
  	"version_pillars_catechist_href" varchar DEFAULT '/catechist',
  	"version_pillars_catechist_image_id" integer,
  	"version_reading_band_eyebrow" varchar DEFAULT 'From the reading room',
  	"version_reading_band_empty_message" varchar DEFAULT 'Reading room opens soon.',
  	"version_reading_band_limit" numeric DEFAULT 6,
  	"version__status" "payload"."enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."manifesto_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Manifesto',
  	"title" varchar DEFAULT 'A digital Sistine Chapel.',
  	"body" jsonb,
  	"_status" "payload"."enum_manifesto_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_manifesto_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_eyebrow" varchar DEFAULT 'Manifesto',
  	"version_title" varchar DEFAULT 'A digital Sistine Chapel.',
  	"version_body" jsonb,
  	"version__status" "payload"."enum__manifesto_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."credits_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Credits',
  	"title" varchar DEFAULT 'Sources & ecclesial review',
  	"body" jsonb,
  	"_status" "payload"."enum_credits_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_credits_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_eyebrow" varchar DEFAULT 'Credits',
  	"version_title" varchar DEFAULT 'Sources & ecclesial review',
  	"version_body" jsonb,
  	"version__status" "payload"."enum__credits_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."members_roles" ADD CONSTRAINT "members_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."members_sessions" ADD CONSTRAINT "members_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."members" ADD CONSTRAINT "members_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_meta_og_image_id_media_id_fk" FOREIGN KEY ("meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_meta_og_image_id_media_id_fk" FOREIGN KEY ("version_meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."miracles_sources" ADD CONSTRAINT "miracles_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."miracles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."miracles_videos" ADD CONSTRAINT "miracles_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."miracles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."miracles" ADD CONSTRAINT "miracles_meta_og_image_id_media_id_fk" FOREIGN KEY ("meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."miracles_rels" ADD CONSTRAINT "miracles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."miracles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."miracles_rels" ADD CONSTRAINT "miracles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_miracles_v_version_sources" ADD CONSTRAINT "_miracles_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_miracles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_miracles_v_version_videos" ADD CONSTRAINT "_miracles_v_version_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_miracles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_miracles_v" ADD CONSTRAINT "_miracles_v_parent_id_miracles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."miracles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_miracles_v" ADD CONSTRAINT "_miracles_v_version_meta_og_image_id_media_id_fk" FOREIGN KEY ("version_meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_miracles_v_rels" ADD CONSTRAINT "_miracles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_miracles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_miracles_v_rels" ADD CONSTRAINT "_miracles_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pilgrimages_route" ADD CONSTRAINT "pilgrimages_route_miracle_id_miracles_id_fk" FOREIGN KEY ("miracle_id") REFERENCES "payload"."miracles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pilgrimages_route" ADD CONSTRAINT "pilgrimages_route_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pilgrimages" ADD CONSTRAINT "pilgrimages_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pilgrimages" ADD CONSTRAINT "pilgrimages_meta_og_image_id_media_id_fk" FOREIGN KEY ("meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pilgrimages_v_version_route" ADD CONSTRAINT "_pilgrimages_v_version_route_miracle_id_miracles_id_fk" FOREIGN KEY ("miracle_id") REFERENCES "payload"."miracles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pilgrimages_v_version_route" ADD CONSTRAINT "_pilgrimages_v_version_route_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pilgrimages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pilgrimages_v" ADD CONSTRAINT "_pilgrimages_v_parent_id_pilgrimages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pilgrimages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pilgrimages_v" ADD CONSTRAINT "_pilgrimages_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pilgrimages_v" ADD CONSTRAINT "_pilgrimages_v_version_meta_og_image_id_media_id_fk" FOREIGN KEY ("version_meta_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_learn_points" ADD CONSTRAINT "doctrine_courses_learn_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."doctrine_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules_units_resources" ADD CONSTRAINT "doctrine_courses_modules_units_resources_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules_units_resources" ADD CONSTRAINT "doctrine_courses_modules_units_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."doctrine_courses_modules_units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules_units_mastery_check_options" ADD CONSTRAINT "doctrine_courses_modules_units_mastery_check_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."doctrine_courses_modules_units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules_units" ADD CONSTRAINT "doctrine_courses_modules_units_lanes_watch_video_id_media_id_fk" FOREIGN KEY ("lanes_watch_video_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules_units" ADD CONSTRAINT "doctrine_courses_modules_units_lanes_listen_audio_id_media_id_fk" FOREIGN KEY ("lanes_listen_audio_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules_units" ADD CONSTRAINT "doctrine_courses_modules_units_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."doctrine_courses_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_modules" ADD CONSTRAINT "doctrine_courses_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."doctrine_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses" ADD CONSTRAINT "doctrine_courses_cover_plate_id_media_id_fk" FOREIGN KEY ("cover_plate_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_rels" ADD CONSTRAINT "doctrine_courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."doctrine_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."doctrine_courses_rels" ADD CONSTRAINT "doctrine_courses_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_learn_points" ADD CONSTRAINT "_doctrine_courses_v_version_learn_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_doctrine_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules_units_resources" ADD CONSTRAINT "_doctrine_courses_v_version_modules_units_resources_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules_units_resources" ADD CONSTRAINT "_doctrine_courses_v_version_modules_units_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_doctrine_courses_v_version_modules_units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules_units_mastery_check_options" ADD CONSTRAINT "_doctrine_courses_v_version_modules_units_mastery_check_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_doctrine_courses_v_version_modules_units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules_units" ADD CONSTRAINT "_doctrine_courses_v_version_modules_units_lanes_watch_video_id_media_id_fk" FOREIGN KEY ("lanes_watch_video_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules_units" ADD CONSTRAINT "_doctrine_courses_v_version_modules_units_lanes_listen_audio_id_media_id_fk" FOREIGN KEY ("lanes_listen_audio_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules_units" ADD CONSTRAINT "_doctrine_courses_v_version_modules_units_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_doctrine_courses_v_version_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_version_modules" ADD CONSTRAINT "_doctrine_courses_v_version_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_doctrine_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v" ADD CONSTRAINT "_doctrine_courses_v_parent_id_doctrine_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."doctrine_courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v" ADD CONSTRAINT "_doctrine_courses_v_version_cover_plate_id_media_id_fk" FOREIGN KEY ("version_cover_plate_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_rels" ADD CONSTRAINT "_doctrine_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_doctrine_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_doctrine_courses_v_rels" ADD CONSTRAINT "_doctrine_courses_v_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "payload"."lms_progress" ADD CONSTRAINT "lms_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "payload"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."lms_progress" ADD CONSTRAINT "lms_progress_unit_id_doctrine_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "payload"."doctrine_units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_miracles_fk" FOREIGN KEY ("miracles_id") REFERENCES "payload"."miracles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pilgrimages_fk" FOREIGN KEY ("pilgrimages_id") REFERENCES "payload"."pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_courses_fk" FOREIGN KEY ("doctrine_courses_id") REFERENCES "payload"."doctrine_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_tracks_fk" FOREIGN KEY ("doctrine_tracks_id") REFERENCES "payload"."doctrine_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_modules_fk" FOREIGN KEY ("doctrine_modules_id") REFERENCES "payload"."doctrine_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctrine_units_fk" FOREIGN KEY ("doctrine_units_id") REFERENCES "payload"."doctrine_units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lms_progress_fk" FOREIGN KEY ("lms_progress_id") REFERENCES "payload"."lms_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."settings_socials" ADD CONSTRAINT "settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."settings" ADD CONSTRAINT "settings_brand_logo_id_media_id_fk" FOREIGN KEY ("brand_logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."settings" ADD CONSTRAINT "settings_brand_favicon_light_id_media_id_fk" FOREIGN KEY ("brand_favicon_light_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."settings" ADD CONSTRAINT "settings_brand_favicon_dark_id_media_id_fk" FOREIGN KEY ("brand_favicon_dark_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page_manifesto_sequence_frames" ADD CONSTRAINT "home_page_manifesto_sequence_frames_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page_manifesto_sequence_frames" ADD CONSTRAINT "home_page_manifesto_sequence_frames_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page" ADD CONSTRAINT "home_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page" ADD CONSTRAINT "home_page_pillars_atlas_image_id_media_id_fk" FOREIGN KEY ("pillars_atlas_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page" ADD CONSTRAINT "home_page_pillars_doctrine_image_id_media_id_fk" FOREIGN KEY ("pillars_doctrine_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page" ADD CONSTRAINT "home_page_pillars_catechist_image_id_media_id_fk" FOREIGN KEY ("pillars_catechist_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_manifesto_sequence_frames" ADD CONSTRAINT "_home_page_v_version_manifesto_sequence_frames_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_manifesto_sequence_frames" ADD CONSTRAINT "_home_page_v_version_manifesto_sequence_frames_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v" ADD CONSTRAINT "_home_page_v_version_pillars_atlas_image_id_media_id_fk" FOREIGN KEY ("version_pillars_atlas_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v" ADD CONSTRAINT "_home_page_v_version_pillars_doctrine_image_id_media_id_fk" FOREIGN KEY ("version_pillars_doctrine_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v" ADD CONSTRAINT "_home_page_v_version_pillars_catechist_image_id_media_id_fk" FOREIGN KEY ("version_pillars_catechist_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "members_roles_order_idx" ON "payload"."members_roles" USING btree ("order");
  CREATE INDEX "members_roles_parent_idx" ON "payload"."members_roles" USING btree ("parent_id");
  CREATE INDEX "members_sessions_order_idx" ON "payload"."members_sessions" USING btree ("_order");
  CREATE INDEX "members_sessions_parent_id_idx" ON "payload"."members_sessions" USING btree ("_parent_id");
  CREATE INDEX "members_avatar_idx" ON "payload"."members" USING btree ("avatar_id");
  CREATE INDEX "members_updated_at_idx" ON "payload"."members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "payload"."members" USING btree ("created_at");
  CREATE UNIQUE INDEX "members_email_idx" ON "payload"."members" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_sequence_sizes_sequence_filename_idx" ON "payload"."media" USING btree ("sizes_sequence_filename");
  CREATE INDEX "articles_hero_hero_image_idx" ON "payload"."articles" USING btree ("hero_image_id");
  CREATE INDEX "articles_meta_meta_og_image_idx" ON "payload"."articles" USING btree ("meta_og_image_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "payload"."articles" USING btree ("slug");
  CREATE INDEX "articles_updated_at_idx" ON "payload"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "payload"."articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "payload"."articles" USING btree ("_status");
  CREATE INDEX "_articles_v_parent_idx" ON "payload"."_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_hero_version_hero_image_idx" ON "payload"."_articles_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_articles_v_version_meta_version_meta_og_image_idx" ON "payload"."_articles_v" USING btree ("version_meta_og_image_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "payload"."_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "payload"."_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "payload"."_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "payload"."_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "payload"."_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "payload"."_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "payload"."_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "payload"."_articles_v" USING btree ("autosave");
  CREATE INDEX "miracles_sources_order_idx" ON "payload"."miracles_sources" USING btree ("_order");
  CREATE INDEX "miracles_sources_parent_id_idx" ON "payload"."miracles_sources" USING btree ("_parent_id");
  CREATE INDEX "miracles_videos_order_idx" ON "payload"."miracles_videos" USING btree ("_order");
  CREATE INDEX "miracles_videos_parent_id_idx" ON "payload"."miracles_videos" USING btree ("_parent_id");
  CREATE INDEX "miracles_meta_meta_og_image_idx" ON "payload"."miracles" USING btree ("meta_og_image_id");
  CREATE UNIQUE INDEX "miracles_slug_idx" ON "payload"."miracles" USING btree ("slug");
  CREATE INDEX "miracles_updated_at_idx" ON "payload"."miracles" USING btree ("updated_at");
  CREATE INDEX "miracles_created_at_idx" ON "payload"."miracles" USING btree ("created_at");
  CREATE INDEX "miracles__status_idx" ON "payload"."miracles" USING btree ("_status");
  CREATE INDEX "miracles_rels_order_idx" ON "payload"."miracles_rels" USING btree ("order");
  CREATE INDEX "miracles_rels_parent_idx" ON "payload"."miracles_rels" USING btree ("parent_id");
  CREATE INDEX "miracles_rels_path_idx" ON "payload"."miracles_rels" USING btree ("path");
  CREATE INDEX "miracles_rels_media_id_idx" ON "payload"."miracles_rels" USING btree ("media_id");
  CREATE INDEX "_miracles_v_version_sources_order_idx" ON "payload"."_miracles_v_version_sources" USING btree ("_order");
  CREATE INDEX "_miracles_v_version_sources_parent_id_idx" ON "payload"."_miracles_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_miracles_v_version_videos_order_idx" ON "payload"."_miracles_v_version_videos" USING btree ("_order");
  CREATE INDEX "_miracles_v_version_videos_parent_id_idx" ON "payload"."_miracles_v_version_videos" USING btree ("_parent_id");
  CREATE INDEX "_miracles_v_parent_idx" ON "payload"."_miracles_v" USING btree ("parent_id");
  CREATE INDEX "_miracles_v_version_meta_version_meta_og_image_idx" ON "payload"."_miracles_v" USING btree ("version_meta_og_image_id");
  CREATE INDEX "_miracles_v_version_version_slug_idx" ON "payload"."_miracles_v" USING btree ("version_slug");
  CREATE INDEX "_miracles_v_version_version_updated_at_idx" ON "payload"."_miracles_v" USING btree ("version_updated_at");
  CREATE INDEX "_miracles_v_version_version_created_at_idx" ON "payload"."_miracles_v" USING btree ("version_created_at");
  CREATE INDEX "_miracles_v_version_version__status_idx" ON "payload"."_miracles_v" USING btree ("version__status");
  CREATE INDEX "_miracles_v_created_at_idx" ON "payload"."_miracles_v" USING btree ("created_at");
  CREATE INDEX "_miracles_v_updated_at_idx" ON "payload"."_miracles_v" USING btree ("updated_at");
  CREATE INDEX "_miracles_v_latest_idx" ON "payload"."_miracles_v" USING btree ("latest");
  CREATE INDEX "_miracles_v_autosave_idx" ON "payload"."_miracles_v" USING btree ("autosave");
  CREATE INDEX "_miracles_v_rels_order_idx" ON "payload"."_miracles_v_rels" USING btree ("order");
  CREATE INDEX "_miracles_v_rels_parent_idx" ON "payload"."_miracles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_miracles_v_rels_path_idx" ON "payload"."_miracles_v_rels" USING btree ("path");
  CREATE INDEX "_miracles_v_rels_media_id_idx" ON "payload"."_miracles_v_rels" USING btree ("media_id");
  CREATE INDEX "pilgrimages_route_order_idx" ON "payload"."pilgrimages_route" USING btree ("_order");
  CREATE INDEX "pilgrimages_route_parent_id_idx" ON "payload"."pilgrimages_route" USING btree ("_parent_id");
  CREATE INDEX "pilgrimages_route_miracle_idx" ON "payload"."pilgrimages_route" USING btree ("miracle_id");
  CREATE INDEX "pilgrimages_cover_image_idx" ON "payload"."pilgrimages" USING btree ("cover_image_id");
  CREATE INDEX "pilgrimages_meta_meta_og_image_idx" ON "payload"."pilgrimages" USING btree ("meta_og_image_id");
  CREATE UNIQUE INDEX "pilgrimages_slug_idx" ON "payload"."pilgrimages" USING btree ("slug");
  CREATE INDEX "pilgrimages_updated_at_idx" ON "payload"."pilgrimages" USING btree ("updated_at");
  CREATE INDEX "pilgrimages_created_at_idx" ON "payload"."pilgrimages" USING btree ("created_at");
  CREATE INDEX "pilgrimages__status_idx" ON "payload"."pilgrimages" USING btree ("_status");
  CREATE INDEX "_pilgrimages_v_version_route_order_idx" ON "payload"."_pilgrimages_v_version_route" USING btree ("_order");
  CREATE INDEX "_pilgrimages_v_version_route_parent_id_idx" ON "payload"."_pilgrimages_v_version_route" USING btree ("_parent_id");
  CREATE INDEX "_pilgrimages_v_version_route_miracle_idx" ON "payload"."_pilgrimages_v_version_route" USING btree ("miracle_id");
  CREATE INDEX "_pilgrimages_v_parent_idx" ON "payload"."_pilgrimages_v" USING btree ("parent_id");
  CREATE INDEX "_pilgrimages_v_version_version_cover_image_idx" ON "payload"."_pilgrimages_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_pilgrimages_v_version_meta_version_meta_og_image_idx" ON "payload"."_pilgrimages_v" USING btree ("version_meta_og_image_id");
  CREATE INDEX "_pilgrimages_v_version_version_slug_idx" ON "payload"."_pilgrimages_v" USING btree ("version_slug");
  CREATE INDEX "_pilgrimages_v_version_version_updated_at_idx" ON "payload"."_pilgrimages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pilgrimages_v_version_version_created_at_idx" ON "payload"."_pilgrimages_v" USING btree ("version_created_at");
  CREATE INDEX "_pilgrimages_v_version_version__status_idx" ON "payload"."_pilgrimages_v" USING btree ("version__status");
  CREATE INDEX "_pilgrimages_v_created_at_idx" ON "payload"."_pilgrimages_v" USING btree ("created_at");
  CREATE INDEX "_pilgrimages_v_updated_at_idx" ON "payload"."_pilgrimages_v" USING btree ("updated_at");
  CREATE INDEX "_pilgrimages_v_latest_idx" ON "payload"."_pilgrimages_v" USING btree ("latest");
  CREATE INDEX "_pilgrimages_v_autosave_idx" ON "payload"."_pilgrimages_v" USING btree ("autosave");
  CREATE INDEX "doctrine_courses_learn_points_order_idx" ON "payload"."doctrine_courses_learn_points" USING btree ("_order");
  CREATE INDEX "doctrine_courses_learn_points_parent_id_idx" ON "payload"."doctrine_courses_learn_points" USING btree ("_parent_id");
  CREATE INDEX "doctrine_courses_modules_units_resources_order_idx" ON "payload"."doctrine_courses_modules_units_resources" USING btree ("_order");
  CREATE INDEX "doctrine_courses_modules_units_resources_parent_id_idx" ON "payload"."doctrine_courses_modules_units_resources" USING btree ("_parent_id");
  CREATE INDEX "doctrine_courses_modules_units_resources_file_idx" ON "payload"."doctrine_courses_modules_units_resources" USING btree ("file_id");
  CREATE INDEX "doctrine_courses_modules_units_mastery_check_options_order_idx" ON "payload"."doctrine_courses_modules_units_mastery_check_options" USING btree ("_order");
  CREATE INDEX "doctrine_courses_modules_units_mastery_check_options_parent_id_idx" ON "payload"."doctrine_courses_modules_units_mastery_check_options" USING btree ("_parent_id");
  CREATE INDEX "doctrine_courses_modules_units_order_idx" ON "payload"."doctrine_courses_modules_units" USING btree ("_order");
  CREATE INDEX "doctrine_courses_modules_units_parent_id_idx" ON "payload"."doctrine_courses_modules_units" USING btree ("_parent_id");
  CREATE INDEX "doctrine_courses_modules_units_lanes_lanes_watch_video_idx" ON "payload"."doctrine_courses_modules_units" USING btree ("lanes_watch_video_id");
  CREATE INDEX "doctrine_courses_modules_units_lanes_lanes_listen_audio_idx" ON "payload"."doctrine_courses_modules_units" USING btree ("lanes_listen_audio_id");
  CREATE INDEX "doctrine_courses_modules_order_idx" ON "payload"."doctrine_courses_modules" USING btree ("_order");
  CREATE INDEX "doctrine_courses_modules_parent_id_idx" ON "payload"."doctrine_courses_modules" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "doctrine_courses_slug_idx" ON "payload"."doctrine_courses" USING btree ("slug");
  CREATE INDEX "doctrine_courses_cover_plate_idx" ON "payload"."doctrine_courses" USING btree ("cover_plate_id");
  CREATE INDEX "doctrine_courses_updated_at_idx" ON "payload"."doctrine_courses" USING btree ("updated_at");
  CREATE INDEX "doctrine_courses_created_at_idx" ON "payload"."doctrine_courses" USING btree ("created_at");
  CREATE INDEX "doctrine_courses__status_idx" ON "payload"."doctrine_courses" USING btree ("_status");
  CREATE INDEX "doctrine_courses_rels_order_idx" ON "payload"."doctrine_courses_rels" USING btree ("order");
  CREATE INDEX "doctrine_courses_rels_parent_idx" ON "payload"."doctrine_courses_rels" USING btree ("parent_id");
  CREATE INDEX "doctrine_courses_rels_path_idx" ON "payload"."doctrine_courses_rels" USING btree ("path");
  CREATE INDEX "doctrine_courses_rels_members_id_idx" ON "payload"."doctrine_courses_rels" USING btree ("members_id");
  CREATE INDEX "_doctrine_courses_v_version_learn_points_order_idx" ON "payload"."_doctrine_courses_v_version_learn_points" USING btree ("_order");
  CREATE INDEX "_doctrine_courses_v_version_learn_points_parent_id_idx" ON "payload"."_doctrine_courses_v_version_learn_points" USING btree ("_parent_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_resources_order_idx" ON "payload"."_doctrine_courses_v_version_modules_units_resources" USING btree ("_order");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_resources_parent_id_idx" ON "payload"."_doctrine_courses_v_version_modules_units_resources" USING btree ("_parent_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_resources_file_idx" ON "payload"."_doctrine_courses_v_version_modules_units_resources" USING btree ("file_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_mastery_check_options_order_idx" ON "payload"."_doctrine_courses_v_version_modules_units_mastery_check_options" USING btree ("_order");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_mastery_check_options_parent_id_idx" ON "payload"."_doctrine_courses_v_version_modules_units_mastery_check_options" USING btree ("_parent_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_order_idx" ON "payload"."_doctrine_courses_v_version_modules_units" USING btree ("_order");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_parent_id_idx" ON "payload"."_doctrine_courses_v_version_modules_units" USING btree ("_parent_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_lanes_lanes_wa_idx" ON "payload"."_doctrine_courses_v_version_modules_units" USING btree ("lanes_watch_video_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_units_lanes_lanes_li_idx" ON "payload"."_doctrine_courses_v_version_modules_units" USING btree ("lanes_listen_audio_id");
  CREATE INDEX "_doctrine_courses_v_version_modules_order_idx" ON "payload"."_doctrine_courses_v_version_modules" USING btree ("_order");
  CREATE INDEX "_doctrine_courses_v_version_modules_parent_id_idx" ON "payload"."_doctrine_courses_v_version_modules" USING btree ("_parent_id");
  CREATE INDEX "_doctrine_courses_v_parent_idx" ON "payload"."_doctrine_courses_v" USING btree ("parent_id");
  CREATE INDEX "_doctrine_courses_v_version_version_slug_idx" ON "payload"."_doctrine_courses_v" USING btree ("version_slug");
  CREATE INDEX "_doctrine_courses_v_version_version_cover_plate_idx" ON "payload"."_doctrine_courses_v" USING btree ("version_cover_plate_id");
  CREATE INDEX "_doctrine_courses_v_version_version_updated_at_idx" ON "payload"."_doctrine_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_doctrine_courses_v_version_version_created_at_idx" ON "payload"."_doctrine_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_doctrine_courses_v_version_version__status_idx" ON "payload"."_doctrine_courses_v" USING btree ("version__status");
  CREATE INDEX "_doctrine_courses_v_created_at_idx" ON "payload"."_doctrine_courses_v" USING btree ("created_at");
  CREATE INDEX "_doctrine_courses_v_updated_at_idx" ON "payload"."_doctrine_courses_v" USING btree ("updated_at");
  CREATE INDEX "_doctrine_courses_v_latest_idx" ON "payload"."_doctrine_courses_v" USING btree ("latest");
  CREATE INDEX "_doctrine_courses_v_rels_order_idx" ON "payload"."_doctrine_courses_v_rels" USING btree ("order");
  CREATE INDEX "_doctrine_courses_v_rels_parent_idx" ON "payload"."_doctrine_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_doctrine_courses_v_rels_path_idx" ON "payload"."_doctrine_courses_v_rels" USING btree ("path");
  CREATE INDEX "_doctrine_courses_v_rels_members_id_idx" ON "payload"."_doctrine_courses_v_rels" USING btree ("members_id");
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
  CREATE INDEX "lms_progress_member_idx" ON "payload"."lms_progress" USING btree ("member_id");
  CREATE INDEX "lms_progress_unit_idx" ON "payload"."lms_progress" USING btree ("unit_id");
  CREATE INDEX "lms_progress_updated_at_idx" ON "payload"."lms_progress" USING btree ("updated_at");
  CREATE INDEX "lms_progress_created_at_idx" ON "payload"."lms_progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload"."payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_miracles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("miracles_id");
  CREATE INDEX "payload_locked_documents_rels_pilgrimages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pilgrimages_id");
  CREATE INDEX "payload_locked_documents_rels_doctrine_courses_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_courses_id");
  CREATE INDEX "payload_locked_documents_rels_doctrine_tracks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_tracks_id");
  CREATE INDEX "payload_locked_documents_rels_doctrine_modules_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_modules_id");
  CREATE INDEX "payload_locked_documents_rels_doctrine_units_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("doctrine_units_id");
  CREATE INDEX "payload_locked_documents_rels_lms_progress_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("lms_progress_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_members_id_idx" ON "payload"."payload_preferences_rels" USING btree ("members_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "settings_socials_order_idx" ON "payload"."settings_socials" USING btree ("_order");
  CREATE INDEX "settings_socials_parent_id_idx" ON "payload"."settings_socials" USING btree ("_parent_id");
  CREATE INDEX "settings_brand_brand_logo_idx" ON "payload"."settings" USING btree ("brand_logo_id");
  CREATE INDEX "settings_brand_brand_favicon_light_idx" ON "payload"."settings" USING btree ("brand_favicon_light_id");
  CREATE INDEX "settings_brand_brand_favicon_dark_idx" ON "payload"."settings" USING btree ("brand_favicon_dark_id");
  CREATE INDEX "home_page_manifesto_sequence_frames_order_idx" ON "payload"."home_page_manifesto_sequence_frames" USING btree ("_order");
  CREATE INDEX "home_page_manifesto_sequence_frames_parent_id_idx" ON "payload"."home_page_manifesto_sequence_frames" USING btree ("_parent_id");
  CREATE INDEX "home_page_manifesto_sequence_frames_image_idx" ON "payload"."home_page_manifesto_sequence_frames" USING btree ("image_id");
  CREATE INDEX "home_page_hero_hero_image_idx" ON "payload"."home_page" USING btree ("hero_image_id");
  CREATE INDEX "home_page_pillars_atlas_pillars_atlas_image_idx" ON "payload"."home_page" USING btree ("pillars_atlas_image_id");
  CREATE INDEX "home_page_pillars_doctrine_pillars_doctrine_image_idx" ON "payload"."home_page" USING btree ("pillars_doctrine_image_id");
  CREATE INDEX "home_page_pillars_catechist_pillars_catechist_image_idx" ON "payload"."home_page" USING btree ("pillars_catechist_image_id");
  CREATE INDEX "home_page__status_idx" ON "payload"."home_page" USING btree ("_status");
  CREATE INDEX "_home_page_v_version_manifesto_sequence_frames_order_idx" ON "payload"."_home_page_v_version_manifesto_sequence_frames" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_manifesto_sequence_frames_parent_id_idx" ON "payload"."_home_page_v_version_manifesto_sequence_frames" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_manifesto_sequence_frames_image_idx" ON "payload"."_home_page_v_version_manifesto_sequence_frames" USING btree ("image_id");
  CREATE INDEX "_home_page_v_version_hero_version_hero_image_idx" ON "payload"."_home_page_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_home_page_v_version_pillars_atlas_version_pillars_atlas_idx" ON "payload"."_home_page_v" USING btree ("version_pillars_atlas_image_id");
  CREATE INDEX "_home_page_v_version_pillars_doctrine_version_pillars_do_idx" ON "payload"."_home_page_v" USING btree ("version_pillars_doctrine_image_id");
  CREATE INDEX "_home_page_v_version_pillars_catechist_version_pillars_c_idx" ON "payload"."_home_page_v" USING btree ("version_pillars_catechist_image_id");
  CREATE INDEX "_home_page_v_version_version__status_idx" ON "payload"."_home_page_v" USING btree ("version__status");
  CREATE INDEX "_home_page_v_created_at_idx" ON "payload"."_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "payload"."_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_latest_idx" ON "payload"."_home_page_v" USING btree ("latest");
  CREATE INDEX "_home_page_v_autosave_idx" ON "payload"."_home_page_v" USING btree ("autosave");
  CREATE INDEX "manifesto_page__status_idx" ON "payload"."manifesto_page" USING btree ("_status");
  CREATE INDEX "_manifesto_page_v_version_version__status_idx" ON "payload"."_manifesto_page_v" USING btree ("version__status");
  CREATE INDEX "_manifesto_page_v_created_at_idx" ON "payload"."_manifesto_page_v" USING btree ("created_at");
  CREATE INDEX "_manifesto_page_v_updated_at_idx" ON "payload"."_manifesto_page_v" USING btree ("updated_at");
  CREATE INDEX "_manifesto_page_v_latest_idx" ON "payload"."_manifesto_page_v" USING btree ("latest");
  CREATE INDEX "_manifesto_page_v_autosave_idx" ON "payload"."_manifesto_page_v" USING btree ("autosave");
  CREATE INDEX "credits_page__status_idx" ON "payload"."credits_page" USING btree ("_status");
  CREATE INDEX "_credits_page_v_version_version__status_idx" ON "payload"."_credits_page_v" USING btree ("version__status");
  CREATE INDEX "_credits_page_v_created_at_idx" ON "payload"."_credits_page_v" USING btree ("created_at");
  CREATE INDEX "_credits_page_v_updated_at_idx" ON "payload"."_credits_page_v" USING btree ("updated_at");
  CREATE INDEX "_credits_page_v_latest_idx" ON "payload"."_credits_page_v" USING btree ("latest");
  CREATE INDEX "_credits_page_v_autosave_idx" ON "payload"."_credits_page_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."members_roles" CASCADE;
  DROP TABLE "payload"."members_sessions" CASCADE;
  DROP TABLE "payload"."members" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."articles" CASCADE;
  DROP TABLE "payload"."_articles_v" CASCADE;
  DROP TABLE "payload"."miracles_sources" CASCADE;
  DROP TABLE "payload"."miracles_videos" CASCADE;
  DROP TABLE "payload"."miracles" CASCADE;
  DROP TABLE "payload"."miracles_rels" CASCADE;
  DROP TABLE "payload"."_miracles_v_version_sources" CASCADE;
  DROP TABLE "payload"."_miracles_v_version_videos" CASCADE;
  DROP TABLE "payload"."_miracles_v" CASCADE;
  DROP TABLE "payload"."_miracles_v_rels" CASCADE;
  DROP TABLE "payload"."pilgrimages_route" CASCADE;
  DROP TABLE "payload"."pilgrimages" CASCADE;
  DROP TABLE "payload"."_pilgrimages_v_version_route" CASCADE;
  DROP TABLE "payload"."_pilgrimages_v" CASCADE;
  DROP TABLE "payload"."doctrine_courses_learn_points" CASCADE;
  DROP TABLE "payload"."doctrine_courses_modules_units_resources" CASCADE;
  DROP TABLE "payload"."doctrine_courses_modules_units_mastery_check_options" CASCADE;
  DROP TABLE "payload"."doctrine_courses_modules_units" CASCADE;
  DROP TABLE "payload"."doctrine_courses_modules" CASCADE;
  DROP TABLE "payload"."doctrine_courses" CASCADE;
  DROP TABLE "payload"."doctrine_courses_rels" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v_version_learn_points" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v_version_modules_units_resources" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v_version_modules_units_mastery_check_options" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v_version_modules_units" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v_version_modules" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v" CASCADE;
  DROP TABLE "payload"."_doctrine_courses_v_rels" CASCADE;
  DROP TABLE "payload"."doctrine_tracks" CASCADE;
  DROP TABLE "payload"."_doctrine_tracks_v" CASCADE;
  DROP TABLE "payload"."doctrine_modules" CASCADE;
  DROP TABLE "payload"."_doctrine_modules_v" CASCADE;
  DROP TABLE "payload"."doctrine_units_mastery_check_options" CASCADE;
  DROP TABLE "payload"."doctrine_units" CASCADE;
  DROP TABLE "payload"."_doctrine_units_v_version_mastery_check_options" CASCADE;
  DROP TABLE "payload"."_doctrine_units_v" CASCADE;
  DROP TABLE "payload"."lms_progress" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_jobs_log" CASCADE;
  DROP TABLE "payload"."payload_jobs" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."settings_socials" CASCADE;
  DROP TABLE "payload"."settings" CASCADE;
  DROP TABLE "payload"."home_page_manifesto_sequence_frames" CASCADE;
  DROP TABLE "payload"."home_page" CASCADE;
  DROP TABLE "payload"."_home_page_v_version_manifesto_sequence_frames" CASCADE;
  DROP TABLE "payload"."_home_page_v" CASCADE;
  DROP TABLE "payload"."manifesto_page" CASCADE;
  DROP TABLE "payload"."_manifesto_page_v" CASCADE;
  DROP TABLE "payload"."credits_page" CASCADE;
  DROP TABLE "payload"."_credits_page_v" CASCADE;
  DROP TYPE "payload"."enum_users_role";
  DROP TYPE "payload"."enum_members_roles";
  DROP TYPE "payload"."enum_articles_status";
  DROP TYPE "payload"."enum__articles_v_version_status";
  DROP TYPE "payload"."enum_miracles_type";
  DROP TYPE "payload"."enum_miracles_ecclesial_status";
  DROP TYPE "payload"."enum_miracles_status";
  DROP TYPE "payload"."enum__miracles_v_version_type";
  DROP TYPE "payload"."enum__miracles_v_version_ecclesial_status";
  DROP TYPE "payload"."enum__miracles_v_version_status";
  DROP TYPE "payload"."enum_pilgrimages_status";
  DROP TYPE "payload"."enum__pilgrimages_v_version_status";
  DROP TYPE "payload"."enum_doctrine_courses_modules_units_resources_kind";
  DROP TYPE "payload"."enum_doctrine_courses_status";
  DROP TYPE "payload"."enum__doctrine_courses_v_version_modules_units_resources_kind";
  DROP TYPE "payload"."enum__doctrine_courses_v_version_status";
  DROP TYPE "payload"."enum_doctrine_tracks_status";
  DROP TYPE "payload"."enum__doctrine_tracks_v_version_status";
  DROP TYPE "payload"."enum_doctrine_modules_status";
  DROP TYPE "payload"."enum__doctrine_modules_v_version_status";
  DROP TYPE "payload"."enum_doctrine_units_status";
  DROP TYPE "payload"."enum__doctrine_units_v_version_status";
  DROP TYPE "payload"."enum_payload_jobs_log_task_slug";
  DROP TYPE "payload"."enum_payload_jobs_log_state";
  DROP TYPE "payload"."enum_payload_jobs_task_slug";
  DROP TYPE "payload"."enum_settings_socials_platform";
  DROP TYPE "payload"."enum_home_page_status";
  DROP TYPE "payload"."enum__home_page_v_version_status";
  DROP TYPE "payload"."enum_manifesto_page_status";
  DROP TYPE "payload"."enum__manifesto_page_v_version_status";
  DROP TYPE "payload"."enum_credits_page_status";
  DROP TYPE "payload"."enum__credits_page_v_version_status";`)
}
