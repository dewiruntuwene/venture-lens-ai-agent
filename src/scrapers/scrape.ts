import { chromium } from 'playwright';
import { initDatabase, insertCompany } from '../db/database.js';
import type { CompanyData, ScraperOptions } from '../types/index.js';

export async function scrapeCompany(options: ScraperOptions): Promise<CompanyData> {
  const { url, headless = true, timeout = 30000 } = options;

  console.log(`Scraping company from: ${url}`);

  const browser = await chromium.launch({ headless });

  try {
    const page = await browser.newPage();
    // Use a desktop user-agent to avoid mobile versions
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout });

    // Wait a bit more for any dynamic content
    await page.waitForTimeout(2000);

    // Extract company information
    const companyData = await page.evaluate(() => {
      const getTextContent = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };

      const getMetaContent = (nameOrProperty: string): string => {
        const element = document.querySelector(
          `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`
        );
        return element?.getAttribute('content') || '';
      };

      // Extract meaningful text content, excluding scripts and styles
      const getMainContent = (): string => {
        const excludeSelectors = [
          'script',
          'style',
          'nav',
          'footer',
          'header',
          'noscript',
          'iframe',
        ];
        const bodyClone = document.body.cloneNode(true) as HTMLElement;

        excludeSelectors.forEach((selector) => {
          bodyClone.querySelectorAll(selector).forEach((el) => el.remove());
        });

        // Get text from common content areas
        const contentSelectors = ['main', 'article', '#content', '.content', '.main'];
        for (const selector of contentSelectors) {
          const contentEl = bodyClone.querySelector(selector);
          if (contentEl && contentEl.textContent?.trim().length! > 200) {
            return contentEl.textContent.trim().replace(/\s+/g, ' ').substring(0, 5000);
          }
        }

        return bodyClone.textContent?.trim().replace(/\s+/g, ' ').substring(0, 5000) || '';
      };

      const companyName =
        getMetaContent('og:site_name') ||
        getTextContent('h1') ||
        document.title.split('|')[0].split('-')[0].trim();

      const description =
        getMetaContent('og:description') ||
        getMetaContent('description') ||
        getTextContent('p') ||
        'No description available';

      const mainContent = getMainContent();

      return {
        companyName,
        description: mainContent || description,
        industry: 'Unknown',
        businessModel: 'Unknown',
        summary: description,
        useCase: 'Unknown',
      };
    });

    console.log(
      `Scraped ${companyData.companyName}. Length of content: ${companyData.description.length}`
    );

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
