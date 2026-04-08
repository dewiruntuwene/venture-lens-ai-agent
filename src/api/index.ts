import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import {
  initDatabase,
  getAllCompanies,
  getCompaniesByIndustry,
  searchCompanies,
} from '../db/database.js';
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
      'GET /companies': 'List all companies',
      'GET /companies?industry=FinTech': 'Filter companies by industry',
      'GET /companies?search=keyword': 'Search companies by keyword',
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
