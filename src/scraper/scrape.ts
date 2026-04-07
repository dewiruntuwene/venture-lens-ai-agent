import { chromium } from 'playwright';
import { initDatabase, insertVenture } from '../db/database.js';

export interface ScraperOptions {
  url: string;
  headless?: boolean;
  timeout?: number;
}

export async function scrapeVenture(options: ScraperOptions) {
  const { url, headless = true, timeout = 30000 } = options;

  console.log(`Scraping venture from: ${url}`);

  const browser = await chromium.launch({ headless });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    // Extract venture information
    const ventureData = await page.evaluate(() => {
      const getTextContent = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };

      // Generic selectors - adjust based on actual target sites
      const name = getTextContent('h1') || document.title;
      const description = getTextContent('meta[name="description"]') ||
                         getTextContent('p') ||
                         'No description available';

      return {
        name,
        description,
      };
    });

    console.log('Scraped data:', ventureData);

    return {
      ...ventureData,
      url,
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
    console.error('Usage: npm run scrape <url>');
    process.exit(1);
  }

  scrapeVenture({ url: targetUrl })
    .then((data) => {
      const db = initDatabase();
      const id = insertVenture(db, data);
      console.log(`✓ Venture saved to database with ID: ${id}`);
      db.close();
    })
    .catch((error) => {
      console.error('Failed to scrape:', error);
      process.exit(1);
    });
}
