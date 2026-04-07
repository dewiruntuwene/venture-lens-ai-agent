import Database from 'better-sqlite3';
import { join } from 'path';

export interface VentureData {
  id?: number;
  name: string;
  url: string;
  description: string;
  scrapedAt: string;
  analysis?: string;
}

export function initDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'ventures.db');
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create ventures table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT,
      scraped_at TEXT NOT NULL,
      analysis TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export function insertVenture(db: Database.Database, venture: VentureData): number {
  const stmt = db.prepare(`
    INSERT INTO ventures (name, url, description, scraped_at)
    VALUES (@name, @url, @description, @scrapedAt)
  `);

  const result = stmt.run(venture);
  return result.lastInsertRowid as number;
}

export function updateVentureAnalysis(db: Database.Database, id: number, analysis: string): void {
  const stmt = db.prepare(`
    UPDATE ventures
    SET analysis = @analysis
    WHERE id = @id
  `);

  stmt.run({ id, analysis });
}

export function getAllVentures(db: Database.Database): VentureData[] {
  const stmt = db.prepare(`
    SELECT
      id,
      name,
      url,
      description,
      scraped_at as scrapedAt,
      analysis
    FROM ventures
    ORDER BY created_at DESC
  `);

  return stmt.all() as VentureData[];
}

export function getVentureById(db: Database.Database, id: number): VentureData | undefined {
  const stmt = db.prepare(`
    SELECT
      id,
      name,
      url,
      description,
      scraped_at as scrapedAt,
      analysis
    FROM ventures
    WHERE id = @id
  `);

  return stmt.get({ id }) as VentureData | undefined;
}
