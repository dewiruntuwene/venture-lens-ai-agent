import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { initDatabase, getAllCompanies, getCompanyById } from '../db/database.js';
import { scrapeCompany } from '../scraper/scrape.js';
import { analyzeCompany } from '../agents/analyzer.js';

const app = new Hono();

// Initialize database
const db = initDatabase();

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Venture Lens AI Agent API',
    endpoints: {
      'GET /': 'This message',
      'GET /companies': 'List all companies',
      'GET /companies/:id': 'Get company by ID',
      'POST /companies/scrape': 'Scrape a new company',
      'POST /companies/:id/analyze': 'Analyze a company',
    },
  });
});

// Get all companies
app.get('/companies', (c) => {
  try {
    const companies = getAllCompanies(db);
    return c.json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Get company by ID
app.get('/companies/:id', (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const company = getCompanyById(db, id);

    if (!company) {
      return c.json(
        {
          success: false,
          error: 'Company not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: company,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Scrape a new company
app.post('/companies/scrape', async (c) => {
  try {
    const body = await c.req.json();
    const { url } = body;

    if (!url) {
      return c.json(
        {
          success: false,
          error: 'URL is required',
        },
        400
      );
    }

    const companyData = await scrapeCompany({ url });
    const { insertCompany } = await import('../db/database.js');
    const id = insertCompany(db, companyData);

    return c.json(
      {
        success: true,
        message: 'Company scraped successfully',
        data: { id, ...companyData },
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Analyze a company
app.post('/companies/:id/analyze', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const company = getCompanyById(db, id);

    if (!company) {
      return c.json(
        {
          success: false,
          error: 'Company not found',
        },
        404
      );
    }

    if (company.analysis) {
      return c.json({
        success: true,
        message: 'Company already analyzed',
        data: { id, analysis: company.analysis },
      });
    }

    const analysis = await analyzeCompany(company);
    const { updateCompanyAnalysis } = await import('../db/database.js');
    updateCompanyAnalysis(db, id, analysis);

    return c.json({
      success: true,
      message: 'Company analyzed successfully',
      data: { id, analysis },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Start server
const port = parseInt(process.env.PORT || '3000');

console.log(`Starting Venture Lens AI Agent API on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✓ Server running at http://localhost:${port}`);
