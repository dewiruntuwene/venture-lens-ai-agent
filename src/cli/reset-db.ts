#!/usr/bin/env bun
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { serviceLogger } from '../utils/logger.js';

/**
 * CLI script to reset the database by deleting the SQLite file.
 * This ensures a completely fresh start with the latest schema.
 */

const dbPath = join(process.cwd(), 'data', 'ventures.db');
const walPath = `${dbPath}-wal`;
const shmPath = `${dbPath}-shm`;

console.log('\n' + '='.repeat(60));
console.log('DATABASE RESET');
console.log('='.repeat(60));

let deleted = false;

const pathsToDelete = [dbPath, walPath, shmPath];

for (const path of pathsToDelete) {
  if (existsSync(path)) {
    try {
      unlinkSync(path);
      serviceLogger.info({ path }, `Deleted database file: ${path}`);
      console.log(`- Deleted: ${path}`);
      deleted = true;
    } catch (error) {
      serviceLogger.error({ error, path }, `Failed to delete ${path}`);
      console.error(`✗ Error deleting ${path}:`, error);
    }
  }
}

if (!deleted) {
  console.log('! No database files found. Nothing to reset.');
} else {
  console.log('\n✓ Database has been reset successfully.');
  console.log('The database will be recreated automatically on the next run.');
}

console.log('='.repeat(60) + '\n');
