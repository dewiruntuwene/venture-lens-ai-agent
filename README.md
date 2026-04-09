# Venture Lens AI Agent

An AI-powered venture capital analysis platform that collects company information through web scraping, analyzes data using AI agents, generates structured insights, and provides results through a comprehensive REST API.

## Features

- **Intelligent Web Scraping**: Extract company information from websites using Playwright
- **AI Analysis**: Powered by Anthropic Claude via Vercel AI SDK
  - **Basic Analysis**: Industry classification, business model, summary, and use cases
    - Competitive landscape analysis
    - Financial viability assessment
    - Market size and growth analysis
    - Comprehensive risk assessment
    - Investment recommendations with confidence scores
- **Structured Data Generation**: AI-validated outputs using Zod schemas
- **Advanced Search & Filtering**:
  - Filter by industry
  - Keyword search across all company data
- **SQLite Database**: Efficient local data storage and management
- **REST API**: Fast Hono-based API with comprehensive endpoints
- **Structured Logging**: Pino-based logging with contextual information across all modules

## Tech Stack

- **Bun**: Fast all-in-one JavaScript runtime
- **TypeScript**: Type-safe development
- **Hono**: Fast, lightweight web framework
- **SQLite (via Bun:sqlite)**: Efficient embedded database
- **Playwright**: Reliable web scraping
- **Vercel AI SDK**: Unified AI interface
- **OpenRouter**: Access to multiple AI models (free tier available)
- **Zod**: Runtime type validation
- **Pino**: High-performance structured logging

## Getting Started

### Prerequisites

- Bun runtime installed
- **OpenRouter API key (recommended - free tier available)** OR Anthropic API key
  - Get free OpenRouter API key at: https://openrouter.ai/keys
  - Free models available: Qwen, DeepSeek, Meta-Llama

### Installation

1. Install dependencies:

```bash
bun install
```

2. Install Playwright browsers:

```bash
bunx playwright install chromium
```

**Important:** This step is required for web scraping to work. If you skip this, you'll get an error like:

```
Executable doesn't exist at .../chrome-headless-shell
```

3. Set up git hooks (Lefthook):

```bash
bun run prepare
```

4. Configure environment:

```bash
cp .env.example .env
```

**Using OpenRouter (Recommended - Free tier available)**

```bash
# Edit .env:
USE_OPENROUTER=true
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Additional settings:**

- `NODE_ENV`: development or production
- `LOG_LEVEL`: debug, info, warn, error (default: info)
- `PORT`: API server port (default: 3000)

## Usage

### Batch Scrape and Analyze (Quick Start)

Automatically scrape 10 companies from GitHub and analyze them with AI:

```bash
bun run batch-scrape
```

This will:

1. Scrape 10 companies from GitHub trending repositories
2. Extract company name, description, and website
3. Save to database
4. Analyze each company with AI to determine:
   - Industry classification (FinTech, HealthTech, etc.)
   - Business model (B2B, B2C, SaaS, etc.)
   - One-sentence summary
   - Potential use cases

**Additional Options:**

```bash
# Scrape from different sources
bun run batch-scrape --source github-trending --limit 10
bun run batch-scrape --source product-hunt --limit 5
bun run batch-scrape --source ycombinator --limit 10

# Skip AI analysis (scrape only)
bun run batch-scrape --no-analyze

# Scrape from all sources
bun run batch-scrape --all

# Get help
bun run batch-scrape --help
```

**Available Data Sources:**

- `github-trending` - Trending GitHub repositories
- `github-awesome` - GitHub awesome lists
- `product-hunt` - Product Hunt products
- `ycombinator` - Y Combinator companies

### Start the API Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`

### Manual Scraping

Scrape a single company URL:

```bash
bun run scrape <url>
```

### Analyze Existing Companies

Analyze all companies in the database that haven't been analyzed:

```bash
bun run analyze
```

## API Endpoints

The API provides two simple endpoints for querying company data:

### GET /companies

Retrieve all companies or filter/search using query parameters.

**Query Parameters:**

- `industry` - Filter companies by industry (e.g., `FinTech`, `HealthTech`, `AI/ML`)
- `search` - Search companies by keyword (searches across name, description, summary, use case)

**Response Format:**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "companyName": "Example Co",
      "description": "...",
      "website": "https://example.com",
      "industry": "FinTech",
      "businessModel": "B2B SaaS",
      "summary": "One-sentence description",
      "useCase": "Relevant use cases",
      "scrapedAt": "2025-04-08T10:00:00Z",
      "analysis": "Detailed analysis..."
    }
  ],
  "filters": {
    "industry": "FinTech",
    "search": null
  }
}
```

### Example Requests

**Get all companies:**

```bash
curl http://localhost:3000/companies
```

**Filter by industry:**

```bash
curl http://localhost:3000/companies?industry=FinTech
curl http://localhost:3000/companies?industry=AI/ML
curl http://localhost:3000/companies?industry=HealthTech
```

**Search by keyword:**

```bash
curl http://localhost:3000/companies?search=blockchain
curl http://localhost:3000/companies?search=chatbot
curl http://localhost:3000/companies?search=payment
```

## Project Structure

```
src/
├── api/           # Hono API route handlers
├── ai/            # AI agents and analyzers (Anthropic Claude via Vercel AI SDK)
│   ├── analyzer.ts       # Basic company analysis
│   └── insight-agent.ts  # Multi-agent deep insights
├── cli/           # Command-line interface tools
│   └── batch-scrape.ts   # Batch scraping CLI
├── db/            # SQLite database layer (Bun:sqlite)
├── scrapers/      # Playwright web scrapers
│   ├── scrape.ts             # Generic website scraper
│   ├── github-scraper.ts     # GitHub trending/awesome lists
│   ├── product-hunt-scraper.ts # Product Hunt products
│   └── ycombinator-scraper.ts  # Y Combinator companies
├── services/      # Business logic services
│   ├── venture-service.ts   # Complete processing pipeline
│   ├── insights-service.ts  # Advanced insights & aggregation
│   └── batch-scraper.ts     # Batch scraping orchestrator
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
│   └── logger.ts         # Pino structured logging
└── data/          # SQLite database storage
```

## Architecture

The platform uses a multi-agent AI architecture with automated data collection:

### Data Collection Pipeline

1. **Batch Scraping**: Automated scrapers collect company data from multiple sources:
   - GitHub trending repositories
   - Product Hunt products
   - Y Combinator companies
   - Awesome lists

2. **Data Extraction**: Three core fields extracted:
   - Company name
   - Description
   - Website URL

3. **AI Analysis**: Automated analysis generates:
   - Industry classification (FinTech, HealthTech, Developer Tools, etc.)
   - Business model (B2B, B2C, SaaS, Marketplace, etc.)
   - One-sentence summary
   - Potential use cases

### Advanced Analysis (Optional)

4. **Deep Insights**: Five specialized AI agents run in parallel:
   - Competitive Intelligence Agent
   - Financial Analysis Agent
   - Market Research Agent
   - Risk Assessment Agent
   - Investment Decision Agent

5. **Synthesis**: Executive summary agent combines all insights

6. **API Access**: RESTful endpoints provide structured data with filtering and search

## Logging

The application uses Pino for structured, high-performance logging with module-specific contexts:

- **API Logger**: HTTP requests, responses, and endpoint operations
- **AI Logger**: AI model interactions, analysis results, and performance metrics
- **Scraper Logger**: Web scraping operations and data extraction
- **Service Logger**: Business logic workflows and pipeline steps
- **DB Logger**: Database operations (available for future use)

**Log Levels**: `debug`, `info`, `warn`, `error`

In development mode, logs are prettified with colors and timestamps. In production, logs are output as JSON for easy parsing and monitoring.

**Example log output:**

```
[INFO] (api): GET /companies?industry=FinTech 200 - 45ms
[INFO] (scraper): Successfully scraped Stripe
[INFO] (ai): Starting AI analysis for Stripe
[INFO] (ai): Analysis completed for Stripe - industry: FinTech, businessModel: B2B SaaS
```

## Complete Workflow Example

Here's a complete example of scraping and analyzing companies:

**Step 1: Batch scrape companies from GitHub**

```bash
bun run batch-scrape --source github-trending --limit 10
```

Expected output:

```
============================================================
BATCH SCRAPING SUMMARY
============================================================
Source: github-trending
Total Scraped: 10
Total Analyzed: 10
Errors: 0

Companies:

1. langchain (ID: 1)
   Industry: AI/ML
   Business Model: Open Source
   Summary: Framework for developing applications powered by language models
   Use Case: Building AI chatbots, document Q&A systems, and LLM-powered applications

2. openai-cookbook (ID: 2)
   Industry: Developer Tools
   Business Model: Open Source
   Summary: Examples and guides for using OpenAI API
   Use Case: Learning OpenAI API integration, building AI applications

...
```

**Step 2: Start the API server**

```bash
bun run dev
```

**Step 3: Query via API**

```bash
# Get all companies
curl http://localhost:3000/companies

# Filter by industry
curl http://localhost:3000/companies?industry=AI/ML

# Search by keyword
curl http://localhost:3000/companies?search=chatbot
```

**Step 4: (Optional) Analyze companies that failed initial analysis**

```bash
bun run analyze
```

## Troubleshooting

### Error: Playwright browsers not installed

**Symptom:**

```
Executable doesn't exist at .../chrome-headless-shell
```

**Solution:**

```bash
bunx playwright install chromium
```

### Error: Credit balance too low

**Symptom:**

```
Your credit balance is too low to access the Anthropic API
```

**Solution:**

- Go to your Anthropic dashboard and add credits
- **Alternative:** Use `--no-analyze` flag to scrape without AI analysis:

```bash
bun run batch-scrape --no-analyze --limit 10
```

Then analyze later when you have credits:

```bash
bun run analyze
```

### Error: Database column missing

**Symptom:**

```
table companies has no column named scraped_at
```

**Solution:**
The database migration runs automatically on next execution. Just run the command again.
