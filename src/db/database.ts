import { Database } from 'bun:sqlite';
import { join } from 'path';
import { type CompanyData } from '../types/index.js';

export function initDatabase(): Database {
  const dbPath = join(process.cwd(), 'data', 'ventures.db');
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.run('PRAGMA journal_mode = WAL');

  // Create companies table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      description TEXT NOT NULL,
      website TEXT NOT NULL,
      industry TEXT NOT NULL,
      business_model TEXT NOT NULL,
      summary TEXT NOT NULL,
      use_case TEXT NOT NULL,
      scraped_at TEXT,
      analysis TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export function insertCompany(db: Database, company: CompanyData): number {
  const stmt = db.prepare(`
    INSERT INTO companies (company_name, description, website, industry, business_model, summary, use_case, scraped_at)
    VALUES ($companyName, $description, $website, $industry, $businessModel, $summary, $useCase, $scrapedAt)
  `);

  const result = stmt.run(
    company.companyName,
    company.description,
    company.website,
    company.industry,
    company.businessModel,
    company.summary,
    company.useCase,
    company.scrapedAt || null
  );
  return Number(result.lastInsertRowid);
}

export function getAllCompanies(db: Database): CompanyData[] {
  const stmt = db.prepare(`
    SELECT
      id,
      company_name as companyName,
      description,
      website,
      industry,
      business_model as businessModel,
      summary,
      use_case as useCase,
      scraped_at as scrapedAt,
      analysis
    FROM companies
    ORDER BY created_at DESC
  `);

  return stmt.all() as CompanyData[];
}

export function getCompanyById(db: Database, id: number): CompanyData | undefined {
  const stmt = db.prepare(`
    SELECT
      id,
      company_name as companyName,
      description,
      website,
      industry,
      business_model as businessModel,
      summary,
      use_case as useCase,
      scraped_at as scrapedAt,
      analysis
    FROM companies
    WHERE id = $id
  `);

  return stmt.get(id) as CompanyData | undefined;
}

export function updateCompanyAnalysis(db: Database, id: number, analysis: string): void {
  const stmt = db.prepare(`
    UPDATE companies
    SET analysis = $analysis
    WHERE id = $id
  `);

  stmt.run(analysis, id);
}

export function updateCompany(db: Database, id: number, company: Partial<CompanyData>): void {
  const fields = [];
  const values: (string | number)[] = [];

  if (company.companyName !== undefined) {
    fields.push('company_name = ?');
    values.push(company.companyName);
  }
  if (company.description !== undefined) {
    fields.push('description = ?');
    values.push(company.description);
  }
  if (company.website !== undefined) {
    fields.push('website = ?');
    values.push(company.website);
  }
  if (company.industry !== undefined) {
    fields.push('industry = ?');
    values.push(company.industry);
  }
  if (company.businessModel !== undefined) {
    fields.push('business_model = ?');
    values.push(company.businessModel);
  }
  if (company.summary !== undefined) {
    fields.push('summary = ?');
    values.push(company.summary);
  }
  if (company.useCase !== undefined) {
    fields.push('use_case = ?');
    values.push(company.useCase);
  }
  if (company.analysis !== undefined) {
    fields.push('analysis = ?');
    values.push(company.analysis);
  }

  if (fields.length === 0) return;

  values.push(id);

  const stmt = db.prepare(`
    UPDATE companies
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

export function deleteCompany(db: Database, id: number): void {
  const stmt = db.prepare('DELETE FROM companies WHERE id = $id');
  stmt.run(id);
}
