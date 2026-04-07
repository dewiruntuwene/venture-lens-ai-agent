import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { initDatabase, getAllVentures, getVentureById } from '../db/database.js';
import { scrapeVenture } from '../scraper/scrape.js';
import { analyzeVenture } from '../agents/analyzer.js';

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
      'GET /ventures': 'List all ventures',
      'GET /ventures/:id': 'Get venture by ID',
      'POST /ventures/scrape': 'Scrape a new venture',
      'POST /ventures/:id/analyze': 'Analyze a venture',
    },
  });
});

// Get all ventures
app.get('/ventures', (c) => {
  try {
    const ventures = getAllVentures(db);
    return c.json({
      success: true,
      count: ventures.length,
      data: ventures,
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

// Get venture by ID
app.get('/ventures/:id', (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const venture = getVentureById(db, id);

    if (!venture) {
      return c.json(
        {
          success: false,
          error: 'Venture not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: venture,
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

// Scrape a new venture
app.post('/ventures/scrape', async (c) => {
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

    const ventureData = await scrapeVenture({ url });
    const { insertVenture } = await import('../db/database.js');
    const id = insertVenture(db, ventureData);

    return c.json(
      {
        success: true,
        message: 'Venture scraped successfully',
        data: { id, ...ventureData },
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

// Analyze a venture
app.post('/ventures/:id/analyze', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const venture = getVentureById(db, id);

    if (!venture) {
      return c.json(
        {
          success: false,
          error: 'Venture not found',
        },
        404
      );
    }

    if (venture.analysis) {
      return c.json({
        success: true,
        message: 'Venture already analyzed',
        data: { id, analysis: venture.analysis },
      });
    }

    const analysis = await analyzeVenture(venture);
    const { updateVentureAnalysis } = await import('../db/database.js');
    updateVentureAnalysis(db, id, analysis);

    return c.json({
      success: true,
      message: 'Venture analyzed successfully',
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
