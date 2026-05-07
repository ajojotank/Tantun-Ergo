import * as migration_20260507_152307_doctrine_courses_init from './20260507_152307_doctrine_courses_init';

export const migrations = [
  {
    up: migration_20260507_152307_doctrine_courses_init.up,
    down: migration_20260507_152307_doctrine_courses_init.down,
    name: '20260507_152307_doctrine_courses_init'
  },
];
