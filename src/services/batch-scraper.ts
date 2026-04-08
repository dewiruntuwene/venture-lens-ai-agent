import { initDatabase, insertCompany } from '../db/database.js';
import { analyzeCompany } from '../ai/analyzer.js';
import {
  scrapeGitHubTrending,
  scrapeGitHubAwesomeList,
  type CompanyBasicData,
} from '../scrapers/github-scraper.js';
import { scrapeProductHunt } from '../scrapers/product-hunt-scraper.js';
import { scrapeYCombinator } from '../scrapers/ycombinator-scraper.js';
import { serviceLogger } from '../utils/logger.js';
import { cleanDescription } from '../utils/data-cleaner.js';

export type DataSource = 'github-trending' | 'github-awesome' | 'product-hunt' | 'ycombinator';

export interface BatchScraperOptions {
  source: DataSource;
  limit?: number;
  analyze?: boolean;
}

export interface BatchScraperResult {
  source: DataSource;
  totalScraped: number;
  totalAnalyzed: number;
  companies: Array<{
    id: number;
    companyName: string;
    industry?: string;
    businessModel?: string;
    summary?: string;
    useCase?: string;
  }>;
  errors: Array<{
    companyName: string;
    error: string;
  }>;
}

export async function batchScrapeAndAnalyze(
  options: BatchScraperOptions
): Promise<BatchScraperResult> {
  const { source, limit = 10, analyze = true } = options;

  serviceLogger.info(
    { source, limit, analyze },
    `Starting batch scrape and analyze from ${source}`
  );

  const result: BatchScraperResult = {
    source,
    totalScraped: 0,
    totalAnalyzed: 0,
    companies: [],
    errors: [],
  };

  try {
    // Step 1: Scrape companies based on source
    let scrapedCompanies: CompanyBasicData[] = [];

    switch (source) {
      case 'github-trending':
        scrapedCompanies = await scrapeGitHubTrending(limit);
        break;
      case 'github-awesome':
        scrapedCompanies = await scrapeGitHubAwesomeList(
          'https://github.com/sindresorhus/awesome',
          limit
        );
        break;
      case 'product-hunt':
        scrapedCompanies = await scrapeProductHunt(limit);
        break;
      case 'ycombinator':
        scrapedCompanies = await scrapeYCombinator(limit);
        break;
      default:
        throw new Error(`Unknown source: ${source}`);
    }

    result.totalScraped = scrapedCompanies.length;
    serviceLogger.info(
      { count: scrapedCompanies.length },
      `Scraped ${scrapedCompanies.length} companies`
    );

    // Step 2: Save to database and optionally analyze
    const db = initDatabase();

    for (const company of scrapedCompanies) {
      try {
        // Clean description before saving and analysis
        const cleanedDescription = cleanDescription(company.description);
        const cleanedSummary = cleanDescription(company.description, 500);

        // Prepare company data with defaults
        const companyData = {
          companyName: company.companyName,
          description: cleanedDescription,
          website: company.website,
          industry: 'Unknown',
          businessModel: 'Unknown',
          summary: cleanedSummary,
          useCase: 'Unknown',
          scrapedAt: new Date().toISOString(),
        };

        // Insert into database
        const id = insertCompany(db, companyData);

        serviceLogger.debug(
          { id, companyName: company.companyName },
          `Saved company ${company.companyName} to database`
        );

        // Analyze if requested
        if (analyze) {
          try {
            // Add a small delay between analyses to avoid rate limits, especially for free models
            if (result.totalScraped > 1) {
              const delay = process.env.USE_OPENROUTER === 'true' ? 5000 : 1000;
              serviceLogger.debug({ delay }, `Waiting ${delay}ms before next analysis...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }

            serviceLogger.info(
              { companyName: company.companyName },
              `Analyzing company ${company.companyName}...`
            );

            const analysisResult = await analyzeCompany(companyData);

            // Update with analysis
            db.prepare(
              `UPDATE companies
               SET industry = ?, business_model = ?, summary = ?, use_case = ?, analysis = ?
               WHERE id = ?`
            ).run(
              analysisResult.industry,
              analysisResult.businessModel,
              analysisResult.summary,
              analysisResult.useCase,
              analysisResult.analysis,
              id
            );

            result.totalAnalyzed++;

            result.companies.push({
              id,
              companyName: company.companyName,
              industry: analysisResult.industry,
              businessModel: analysisResult.businessModel,
              summary: analysisResult.summary,
              useCase: analysisResult.useCase,
            });

            serviceLogger.info(
              {
                companyName: company.companyName,
                industry: analysisResult.industry,
                businessModel: analysisResult.businessModel,
              },
              `Successfully analyzed ${company.companyName}`
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            serviceLogger.error(
              { error, companyName: company.companyName },
              `Failed to analyze ${company.companyName}`
            );
            result.errors.push({
              companyName: company.companyName,
              error: errorMessage,
            });

            // Still add to results but without analysis
            result.companies.push({
              id,
              companyName: company.companyName,
            });
          }
        } else {
          result.companies.push({
            id,
            companyName: company.companyName,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        serviceLogger.error(
          { error, companyName: company.companyName },
          `Failed to save ${company.companyName}`
        );
        result.errors.push({
          companyName: company.companyName,
          error: errorMessage,
        });
      }
    }

    db.close();

    serviceLogger.info(
      {
        source,
        totalScraped: result.totalScraped,
        totalAnalyzed: result.totalAnalyzed,
        errors: result.errors.length,
      },
      `Batch scrape and analyze complete`
    );

    return result;
  } catch (error) {
    serviceLogger.error({ error, source }, 'Batch scraping failed');
    throw error;
  }
}

export async function batchScrapeFromMultipleSources(
  limit: number = 10
): Promise<BatchScraperResult[]> {
  const sources: DataSource[] = ['github-trending'];

  serviceLogger.info({ sources, limit }, `Starting batch scrape from ${sources.length} sources`);

  const results: BatchScraperResult[] = [];

  for (const source of sources) {
    try {
      const result = await batchScrapeAndAnalyze({
        source,
        limit,
        analyze: true,
      });
      results.push(result);
    } catch (error) {
      serviceLogger.error({ error, source }, `Failed to scrape from ${source}`);
    }
  }

  serviceLogger.info(
    { totalSources: sources.length, successfulSources: results.length },
    'Multi-source batch scraping complete'
  );

  return results;
}
