# Venture Lens AI Agent

An AI-powered venture capital analysis platform that scrapes venture information and provides intelligent, structured insights using OpenRouter and the Qwen model.

## Features

- **Web Scraping**: Extract venture information from websites using Playwright.
- **AI Analysis**: Generate structured insights using OpenRouter (`qwen/qwen3-next-80b-a3b-instruct:free`):
  - **Industry Classification**: Automated tagging (e.g., FinTech, HealthTech, Developer Tools).
  - **Business Model**: Analysis of revenue approach (e.g., B2B, B2C, SaaS, Marketplace).
  - **One-Sentence Summary**: Concise value proposition.
  - **Potential Use Cases**: Specific applications of the technology/service.
  - **Comprehensive VC Analysis**: Markdown report on market potential, risks, and viability.
- **SQLite Database**: Store and manage venture data efficiently.
- **REST API**: Hono-based API for interacting with the system.

## Tech Stack

- **Bun**: Fast all-in-one JavaScript runtime.
- **TypeScript**: Type-safe development.
- **Hono**: Fast web framework.
- **SQLite (via Bun:sqlite)**: Efficient SQLite database.
- **Playwright**: Reliable web scraping.
- **OpenRouter**: Access to top LLMs including Qwen.

## Getting Started

### Prerequisites

- Bun runtime installed.
- OpenRouter API key.

### Installation

1. Install dependencies:

```bash
bun install
```

2. Install Playwright browsers:

```bash
bunx playwright install chromium
```

3. Set up git hooks (Lefthook):

```bash
bun run prepare
```

4. Configure environment:

```bash
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

## Usage

### Start the API Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`

### Scrape a Venture

```bash
bun run scrape <url>
```

### Analyze Ventures

```bash
bun run analyze
```

This will analyze all ventures in the database that haven't been analyzed yet or have "Unknown" industry tags.

## API Endpoints

- `GET /` - API information
- `GET /companies` - List all companies
- `GET /companies/:id` - Get company by ID
- `POST /companies/scrape` - Scrape a new company
  ```json
  {
    "url": "https://example.com"
  }
  ```
- `POST /companies/:id/analyze` - Analyze a specific company

## Project Structure

```
src/
├── api/          # API route handlers (Hono)
├── db/           # Database models and queries (Bun:sqlite)
├── scraper/      # Web scrapers (Playwright)
├── agents/       # AI analysis agents (OpenRouter API)
└── data/         # SQLite database storage
```
