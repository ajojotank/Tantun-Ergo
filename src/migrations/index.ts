import * as migration_20260507_152307_doctrine_courses_init from './20260507_152307_doctrine_courses_init';
import * as migration_20260507_160704_lms_progress_unitpath from './20260507_160704_lms_progress_unitpath';
import * as migration_20260507_171818_drop_old_doctrine_tables from './20260507_171818_drop_old_doctrine_tables';
import * as migration_20260508_133137_catechist_settings_columns from './20260508_133137_catechist_settings_columns';
import * as migration_20260508_154942_catechist_collections_init from './20260508_154942_catechist_collections_init';
import * as migration_20260511_091948_sources_rename_is_sample from './20260511_091948_sources_rename_is_sample';
import * as migration_20260511_094305_locked_docs_rels_catechist from './20260511_094305_locked_docs_rels_catechist';
import * as migration_20260511_110734_sources_file_optional from './20260511_110734_sources_file_optional';

export const migrations = [
  {
    up: migration_20260507_152307_doctrine_courses_init.up,
    down: migration_20260507_152307_doctrine_courses_init.down,
    name: '20260507_152307_doctrine_courses_init',
  },
  {
    up: migration_20260507_160704_lms_progress_unitpath.up,
    down: migration_20260507_160704_lms_progress_unitpath.down,
    name: '20260507_160704_lms_progress_unitpath',
  },
  {
    up: migration_20260507_171818_drop_old_doctrine_tables.up,
    down: migration_20260507_171818_drop_old_doctrine_tables.down,
    name: '20260507_171818_drop_old_doctrine_tables'
  },
  {
    up: migration_20260508_133137_catechist_settings_columns.up,
    down: migration_20260508_133137_catechist_settings_columns.down,
    name: '20260508_133137_catechist_settings_columns'
  },
  {
    up: migration_20260508_154942_catechist_collections_init.up,
    down: migration_20260508_154942_catechist_collections_init.down,
    name: '20260508_154942_catechist_collections_init'
  },
  {
    up: migration_20260511_091948_sources_rename_is_sample.up,
    down: migration_20260511_091948_sources_rename_is_sample.down,
    name: '20260511_091948_sources_rename_is_sample'
  },
  {
    up: migration_20260511_094305_locked_docs_rels_catechist.up,
    down: migration_20260511_094305_locked_docs_rels_catechist.down,
    name: '20260511_094305_locked_docs_rels_catechist'
  },
  {
    up: migration_20260511_110734_sources_file_optional.up,
    down: migration_20260511_110734_sources_file_optional.down,
    name: '20260511_110734_sources_file_optional'
  },
];
