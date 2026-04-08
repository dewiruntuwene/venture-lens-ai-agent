import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import {
  initDatabase,
  getAllCompanies,
  getCompanyById,
  insertCompany,
  updateCompany,
  getCompaniesByIndustry,
  searchCompanies,
} from '../db/database.js';
import { scrapeCompany } from '../scrapers/scrape.js';
import { analyzeCompany } from '../ai/analyzer.js';
import { processVenture } from '../services/venture-service.js';
import { apiLogger } from '../utils/logger.js';

const app = new Hono();

// Custom Pino logger middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;

  await next();

  const duration = Date.now() - start;
  const { status } = c.res;

  apiLogger.info(
    {
      method,
      url,
      status,
      duration: `${duration}ms`,
    },
    `${method} ${url} ${status} - ${duration}ms`
  );
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Venture Lens AI Agent API',
    version: '2.0.0',
    endpoints: {
      'GET /': 'This message',
      'GET /companies': 'List all companies',
      'GET /companies?industry=FinTech': 'Filter companies by industry',
      'GET /companies?search=keyword': 'Search companies by keyword',
      'GET /companies/:id': 'Get company by ID',
      'POST /process': 'Complete flow: Scrape + Analyze (requires { url })',
      'POST /companies/scrape': 'Scrape only (requires { url })',
      'POST /companies/:id/analyze': 'Analyze an existing company',
    },
  });
});

// Get all companies with optional filtering
app.get('/companies', (c) => {
  const db = initDatabase();
  try {
    const industry = c.req.query('industry');
    const search = c.req.query('search');

    let companies;

    if (industry) {
      apiLogger.debug({ industry }, 'Filtering companies by industry');
      companies = getCompaniesByIndustry(db, industry);
    } else if (search) {
      apiLogger.debug({ search }, 'Searching companies by keyword');
      companies = searchCompanies(db, search);
    } else {
      companies = getAllCompanies(db);
    }

    apiLogger.info({ count: companies.length, industry, search }, 'Retrieved companies');

    return c.json({
      success: true,
      count: companies.length,
      data: companies,
      filters: {
        industry: industry || null,
        search: search || null,
      },
    });
  } catch (error) {
    apiLogger.error({ error }, 'Failed to retrieve companies');
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  } finally {
    db.close();
  }
});

// Get company by ID
app.get('/companies/:id', (c) => {
  const db = initDatabase();
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
  } finally {
    db.close();
  }
});

// Unified process: Scrape + Analyze
app.post('/process', async (c) => {
  try {
    const body = await c.req.json();
    const { url } = body;

    if (!url) {
      apiLogger.warn('Process request missing URL');
      return c.json(
        {
          success: false,
          error: 'URL is required',
        },
        400
      );
    }

    apiLogger.info({ url }, 'Starting company processing workflow');
    const result = await processVenture(url);
    apiLogger.info(
      { companyId: result.id, companyName: result.data.companyName },
      'Company processed successfully'
    );

    return c.json(
      {
        success: true,
        message: 'Company processed successfully',
        data: result.data,
      },
      201
    );
  } catch (error) {
    apiLogger.error({ error }, 'Failed to process company');
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Scrape only
app.post('/companies/scrape', async (c) => {
  const db = initDatabase();
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
  } finally {
    db.close();
  }
});

// Analyze existing
app.post('/companies/:id/analyze', async (c) => {
  const db = initDatabase();
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

    const result = await analyzeCompany(company);
    updateCompany(db, id, {
      industry: result.industry,
      businessModel: result.businessModel,
      summary: result.summary,
      useCase: result.useCase,
      analysis: result.analysis,
    });

    return c.json({
      success: true,
      message: 'Company analyzed successfully',
      data: { id, ...result },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  } finally {
    db.close();
  }
});

// Start server
const port = parseInt(process.env.PORT || '3000');

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    apiLogger.info(
      {
        port: info.port,
        version: '2.0.0',
        env: process.env.NODE_ENV || 'development',
      },
      `Venture Lens AI Agent API running at http://localhost:${info.port}`
    );
  }
);
