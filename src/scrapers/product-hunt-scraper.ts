import { chromium } from 'playwright';
import { scraperLogger } from '../utils/logger.js';
import type { CompanyBasicData } from './github-scraper.js';

export async function scrapeProductHunt(limit: number = 10): Promise<CompanyBasicData[]> {
  scraperLogger.info({ limit }, 'Starting Product Hunt scrape');

  const browser = await chromium.launch({ headless: true });
  const companies: CompanyBasicData[] = [];

  try {
    const page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });

    await page.goto('https://www.producthunt.com/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for products to load
    await page.waitForTimeout(3000);

    scraperLogger.debug('Product Hunt page loaded');

    // Extract product data
    const products = await page.evaluate(() => {
      const results: Array<{
        name: string;
        description: string;
        url: string;
      }> = [];

      // Try multiple selectors as Product Hunt structure may vary
      const productCards = document.querySelectorAll('[data-test="post-item"]');

      productCards.forEach((card) => {
        const nameEl = card.querySelector('a[href^="/posts/"]');
        const descEl = card.querySelector('[data-test="post-tagline"]');

        if (nameEl) {
          const name = nameEl.textContent?.trim() || '';
          const description = descEl?.textContent?.trim() || 'Innovative product';
          const href = nameEl.getAttribute('href') || '';

          if (name && href) {
            results.push({
              name,
              description,
              url: `https://www.producthunt.com${href}`,
            });
          }
        }
      });

      return results;
    });

    scraperLogger.info({ count: products.length }, `Found ${products.length} products`);

    // Convert to company data format
    for (let i = 0; i < Math.min(limit, products.length); i++) {
      const product = products[i];
      companies.push({
        companyName: product.name,
        description: product.description,
        website: product.url,
      });
    }

    scraperLogger.info(
      { count: companies.length },
      `Successfully scraped ${companies.length} companies from Product Hunt`
    );
  } catch (error) {
    scraperLogger.error({ error }, 'Failed to scrape Product Hunt');
    throw error;
  } finally {
    await browser.close();
  }

  return companies;
}
