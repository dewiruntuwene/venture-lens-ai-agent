import { chromium } from 'playwright';
import { scraperLogger } from '../utils/logger.js';
import type { CompanyBasicData } from './github-scraper.js';

export async function scrapeYCombinator(limit: number = 10): Promise<CompanyBasicData[]> {
  scraperLogger.info({ limit }, 'Starting Y Combinator companies scrape');

  const browser = await chromium.launch({ headless: true });
  const companies: CompanyBasicData[] = [];

  try {
    const page = await browser.newPage();

    await page.goto('https://www.ycombinator.com/companies', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for companies to load
    await page.waitForTimeout(2000);

    scraperLogger.debug('YC companies page loaded');

    // Extract company data
    const yc_companies = await page.evaluate(() => {
      const results: Array<{
        name: string;
        description: string;
        url: string;
      }> = [];

      // YC companies are typically in a list format
      const companyCards = document.querySelectorAll('a[href^="/companies/"]');

      companyCards.forEach((card) => {
        const name =
          card.querySelector('h3')?.textContent?.trim() ||
          card.querySelector('span')?.textContent?.trim() ||
          '';
        const description =
          card.querySelector('p')?.textContent?.trim() || 'Y Combinator backed company';
        const href = card.getAttribute('href') || '';

        if (name && href) {
          results.push({
            name,
            description,
            url: `https://www.ycombinator.com${href}`,
          });
        }
      });

      return results;
    });

    scraperLogger.info({ count: yc_companies.length }, `Found ${yc_companies.length} YC companies`);

    // Convert to company data format
    for (let i = 0; i < Math.min(limit, yc_companies.length); i++) {
      const company = yc_companies[i];
      companies.push({
        companyName: company.name,
        description: company.description,
        website: company.url,
      });
    }

    scraperLogger.info(
      { count: companies.length },
      `Successfully scraped ${companies.length} companies from Y Combinator`
    );
  } catch (error) {
    scraperLogger.error({ error }, 'Failed to scrape Y Combinator');
    throw error;
  } finally {
    await browser.close();
  }

  return companies;
}
