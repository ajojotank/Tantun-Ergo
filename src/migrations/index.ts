import * as migration_20260507_152307_doctrine_courses_init from './20260507_152307_doctrine_courses_init';
import * as migration_20260507_160704_lms_progress_unitpath from './20260507_160704_lms_progress_unitpath';

export const migrations = [
  {
    up: migration_20260507_152307_doctrine_courses_init.up,
    down: migration_20260507_152307_doctrine_courses_init.down,
    name: '20260507_152307_doctrine_courses_init',
  },
  {
    up: migration_20260507_160704_lms_progress_unitpath.up,
    down: migration_20260507_160704_lms_progress_unitpath.down,
    name: '20260507_160704_lms_progress_unitpath'
  },
];
