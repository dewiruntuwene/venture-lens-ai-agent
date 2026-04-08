import { initDatabase, insertCompany, updateCompany, getCompanyById } from '../db/database.js';
import { scrapeCompany } from '../scrapers/scrape.js';
import { analyzeCompany } from '../ai/analyzer.js';
import type { CompanyData, AnalysisResult } from '../types/index.js';

export async function processVenture(
  url: string
): Promise<{ id: number; data: CompanyData & Partial<AnalysisResult> }> {
  const db = initDatabase();

  try {
    // 1. Scrape
    console.log(`Step 1: Scraping ${url}...`);
    const scrapedData = await scrapeCompany({ url });

    // 2. Save initial data
    const id = insertCompany(db, scrapedData);
    console.log(`Step 2: Saved company with ID ${id}`);

    // 3. Analyze
    console.log(`Step 3: Analyzing ${scrapedData.companyName}...`);
    const analysisResult = await analyzeCompany(scrapedData);

    // 4. Update with analysis
    updateCompany(db, id, {
      industry: analysisResult.industry,
      businessModel: analysisResult.businessModel,
      summary: analysisResult.summary,
      useCase: analysisResult.useCase,
      analysis: analysisResult.analysis,
    });
    console.log(`Step 4: Updated analysis for ${scrapedData.companyName}`);

    const finalData = getCompanyById(db, id);

    return {
      id,
      data: finalData as CompanyData,
    };
  } catch (error) {
    console.error('Error in venture processing pipeline:', error);
    throw error;
  } finally {
    db.close();
  }
}
