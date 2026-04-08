import { initDatabase, insertCompany, updateCompany, getCompanyById } from '../db/database.js';
import { scrapeCompany } from '../scrapers/scrape.js';
import { analyzeCompany } from '../ai/analyzer.js';
import type { CompanyData, AnalysisResult } from '../types/index.js';
import { serviceLogger } from '../utils/logger.js';

export async function processVenture(
  url: string
): Promise<{ id: number; data: CompanyData & Partial<AnalysisResult> }> {
  const db = initDatabase();

  try {
    // 1. Scrape
    serviceLogger.info({ url }, 'Step 1/4: Starting scrape');
    const scrapedData = await scrapeCompany({ url });

    // 2. Save initial data
    const id = insertCompany(db, scrapedData);
    serviceLogger.info({ id, companyName: scrapedData.companyName }, 'Step 2/4: Saved to database');

    // 3. Analyze
    serviceLogger.info({ companyName: scrapedData.companyName }, 'Step 3/4: Starting AI analysis');
    const analysisResult = await analyzeCompany(scrapedData);

    // 4. Update with analysis
    updateCompany(db, id, {
      industry: analysisResult.industry,
      businessModel: analysisResult.businessModel,
      summary: analysisResult.summary,
      useCase: analysisResult.useCase,
      analysis: analysisResult.analysis,
    });
    serviceLogger.info(
      {
        id,
        companyName: scrapedData.companyName,
        industry: analysisResult.industry,
        businessModel: analysisResult.businessModel,
      },
      'Step 4/4: Processing complete'
    );

    const finalData = getCompanyById(db, id);

    return {
      id,
      data: finalData as CompanyData,
    };
  } catch (error) {
    serviceLogger.error({ error, url }, 'Venture processing pipeline failed');
    throw error;
  } finally {
    db.close();
  }
}
