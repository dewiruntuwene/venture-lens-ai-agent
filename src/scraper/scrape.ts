import { chromium } from 'playwright';
import { initDatabase, insertCompany, type CompanyData } from '../db/database.js';

export interface ScraperOptions {
  url: string;
  headless?: boolean;
  timeout?: number;
}

export async function scrapeCompany(options: ScraperOptions): Promise<CompanyData> {
  const { url, headless = true, timeout = 30000 } = options;

  console.log(`Scraping company from: ${url}`);

  const browser = await chromium.launch({ headless });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    // Extract company information
    // Note: page.evaluate runs in browser context where DOM APIs are available
    const companyData = await page.evaluate(() => {
      const getTextContent = (selector: string): string => {
        const element = (globalThis as any).document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };

      const getMetaContent = (name: string): string => {
        const element = (globalThis as any).document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return element?.getAttribute('content') || '';
      };

      // Generic selectors - adjust based on actual target sites
      const companyName = getTextContent('h1') || (globalThis as any).document.title;
      const description =
        getMetaContent('description') || getTextContent('p') || 'No description available';

      return {
        companyName,
        description,
        industry: 'Unknown',
        businessModel: 'Unknown',
        summary: description,
        useCase: 'Unknown',
      };
    });

    console.log('Scraped data:', companyData);

    return {
      ...companyData,
      website: url,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetUrl = process.argv[2];

  if (!targetUrl) {
    console.error('Usage: bun run scrape <url>');
    process.exit(1);
  }

  scrapeCompany({ url: targetUrl })
    .then((data) => {
      const db = initDatabase();
      const id = insertCompany(db, data);
      console.log(`✓ Company saved to database with ID: ${id}`);
      db.close();
    })
    .catch((error) => {
      console.error('Failed to scrape:', error);
      process.exit(1);
    });
}
