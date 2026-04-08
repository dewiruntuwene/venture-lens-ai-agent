#!/usr/bin/env bun
import {
  batchScrapeAndAnalyze,
  batchScrapeFromMultipleSources,
  type DataSource,
} from '../services/batch-scraper.js';
import { serviceLogger } from '../utils/logger.js';

// Parse command line arguments
const args = process.argv.slice(2);

function printUsage() {
  console.log(`
Usage: bun src/cli/batch-scrape.ts [options]

Options:
  --source <source>     Data source to scrape from
                        Options: github-trending, github-awesome, product-hunt, ycombinator
                        Default: github-trending

  --limit <number>      Number of companies to scrape
                        Default: 10

  --no-analyze          Skip AI analysis (only scrape and save)

  --all                 Scrape from all available sources

Examples:
  bun src/cli/batch-scrape.ts
  bun src/cli/batch-scrape.ts --source github-trending --limit 10
  bun src/cli/batch-scrape.ts --source product-hunt --limit 5
  bun src/cli/batch-scrape.ts --no-analyze
  bun src/cli/batch-scrape.ts --all
`);
}

async function main() {
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  const sourceIndex = args.indexOf('--source');
  const limitIndex = args.indexOf('--limit');
  const noAnalyze = args.includes('--no-analyze');
  const all = args.includes('--all');

  const source: DataSource =
    sourceIndex !== -1 ? (args[sourceIndex + 1] as DataSource) : 'github-trending';
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : 10;
  const analyze = !noAnalyze;

  serviceLogger.info('='.repeat(60));
  serviceLogger.info('Starting Batch Scrape and Analyze');
  serviceLogger.info('='.repeat(60));

  try {
    if (all) {
      // Scrape from all sources
      serviceLogger.info({ limit }, 'Scraping from all sources...');
      const results = await batchScrapeFromMultipleSources(limit);

      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('BATCH SCRAPING SUMMARY');
      console.log('='.repeat(60));

      for (const result of results) {
        console.log(`\nSource: ${result.source}`);
        console.log(`  Total Scraped: ${result.totalScraped}`);
        console.log(`  Total Analyzed: ${result.totalAnalyzed}`);
        console.log(`  Errors: ${result.errors.length}`);

        if (result.companies.length > 0) {
          console.log('\n  Companies:');
          result.companies.forEach((company, index) => {
            console.log(`    ${index + 1}. ${company.companyName}`);
            if (company.industry) console.log(`       Industry: ${company.industry}`);
            if (company.businessModel) console.log(`       Model: ${company.businessModel}`);
          });
        }
      }

      const totalScraped = results.reduce((sum, r) => sum + r.totalScraped, 0);
      const totalAnalyzed = results.reduce((sum, r) => sum + r.totalAnalyzed, 0);

      console.log('\n' + '='.repeat(60));
      console.log(`Total companies scraped: ${totalScraped}`);
      console.log(`Total companies analyzed: ${totalAnalyzed}`);
      console.log('='.repeat(60) + '\n');
    } else {
      // Scrape from single source
      serviceLogger.info({ source, limit, analyze }, `Scraping from ${source}...`);
      const result = await batchScrapeAndAnalyze({ source, limit, analyze });

      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('BATCH SCRAPING SUMMARY');
      console.log('='.repeat(60));
      console.log(`Source: ${result.source}`);
      console.log(`Total Scraped: ${result.totalScraped}`);
      console.log(`Total Analyzed: ${result.totalAnalyzed}`);
      console.log(`Errors: ${result.errors.length}`);

      if (result.companies.length > 0) {
        console.log('\nCompanies:');
        result.companies.forEach((company, index) => {
          console.log(`\n${index + 1}. ${company.companyName} (ID: ${company.id})`);
          if (company.industry) console.log(`   Industry: ${company.industry}`);
          if (company.businessModel) console.log(`   Business Model: ${company.businessModel}`);
          if (company.summary) console.log(`   Summary: ${company.summary}`);
          if (company.useCase) console.log(`   Use Case: ${company.useCase}`);
        });
      }

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.companyName}: ${error.error}`);
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log('✓ Batch scraping complete!');
      console.log('='.repeat(60) + '\n');
    }
  } catch (error) {
    serviceLogger.error({ error }, 'Batch scraping failed');
    console.error('\n✗ Batch scraping failed:', error);
    process.exit(1);
  }
}

main();
