import { chromium } from 'playwright';
import { scraperLogger } from '../utils/logger.js';

export interface CompanyBasicData {
  companyName: string;
  description: string;
  website: string;
}

export async function scrapeGitHubTrending(limit: number = 10): Promise<CompanyBasicData[]> {
  scraperLogger.info({ limit }, 'Starting GitHub trending repositories scrape');

  const browser = await chromium.launch({ headless: true });
  const companies: CompanyBasicData[] = [];

  try {
    const page = await browser.newPage();

    // GitHub Trending page
    await page.goto('https://github.com/trending', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    scraperLogger.debug('GitHub trending page loaded');

    // Extract repository data
    const repos = await page.evaluate(() => {
      const articles = document.querySelectorAll('article.Box-row');
      const results: Array<{
        name: string;
        description: string;
        url: string;
      }> = [];

      articles.forEach((article) => {
        const nameEl = article.querySelector('h2 a');
        const descEl = article.querySelector('p.col-9');

        if (nameEl) {
          const fullName = nameEl.textContent?.trim() || '';
          const url = nameEl.getAttribute('href') || '';
          const description = descEl?.textContent?.trim() || 'No description available';

          // Extract owner/repo name
          const parts = fullName.split('/').map((p) => p.trim());
          const repoName = parts[parts.length - 1] || fullName;

          results.push({
            name: repoName,
            description,
            url: `https://github.com${url}`,
          });
        }
      });

      return results;
    });

    scraperLogger.info({ count: repos.length }, `Found ${repos.length} trending repositories`);

    // Convert to company data format (limit to requested amount)
    for (let i = 0; i < Math.min(limit, repos.length); i++) {
      const repo = repos[i];
      companies.push({
        companyName: repo.name,
        description: repo.description,
        website: repo.url,
      });
    }

    scraperLogger.info(
      { count: companies.length },
      `Successfully scraped ${companies.length} companies from GitHub`
    );
  } catch (error) {
    scraperLogger.error({ error }, 'Failed to scrape GitHub trending');
    throw error;
  } finally {
    await browser.close();
  }

  return companies;
}

export async function scrapeGitHubAwesomeList(
  listUrl: string = 'https://github.com/sindresorhus/awesome',
  limit: number = 10
): Promise<CompanyBasicData[]> {
  scraperLogger.info({ listUrl, limit }, 'Starting GitHub awesome list scrape');

  const browser = await chromium.launch({ headless: true });
  const companies: CompanyBasicData[] = [];

  try {
    const page = await browser.newPage();
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract links from awesome lists
    const links = await page.evaluate(() => {
      const items = document.querySelectorAll('article li a');
      const results: Array<{ name: string; url: string }> = [];

      items.forEach((link) => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();

        if (href && text && href.startsWith('http')) {
          results.push({ name: text, url: href });
        }
      });

      return results;
    });

    scraperLogger.debug({ count: links.length }, `Found ${links.length} links in awesome list`);

    // Visit each link to get description (limit to requested amount)
    for (let i = 0; i < Math.min(limit, links.length); i++) {
      try {
        const link = links[i];
        const linkPage = await browser.newPage();
        await linkPage.goto(link.url, { waitUntil: 'domcontentloaded', timeout: 10000 });

        const description = await linkPage.evaluate(() => {
          const metaDesc =
            document.querySelector('meta[name="description"]')?.getAttribute('content') ||
            document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            '';
          return metaDesc;
        });

        await linkPage.close();

        companies.push({
          companyName: link.name,
          description: description || 'No description available',
          website: link.url,
        });

        scraperLogger.debug({ companyName: link.name }, `Scraped company ${i + 1}/${limit}`);
      } catch (error) {
        scraperLogger.warn({ error, index: i }, `Failed to scrape link ${i}`);
        continue;
      }
    }

    scraperLogger.info(
      { count: companies.length },
      `Successfully scraped ${companies.length} companies from awesome list`
    );
  } catch (error) {
    scraperLogger.error({ error }, 'Failed to scrape GitHub awesome list');
    throw error;
  } finally {
    await browser.close();
  }

  return companies;
}
