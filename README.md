# Venture Lens AI Agent

An AI-powered venture capital analysis platform that scrapes venture information and provides intelligent analysis using Claude AI.

## Features

- **Web Scraping**: Extract venture information from websites using Playwright
- **AI Analysis**: Analyze ventures using Anthropic's Claude AI for market potential, risks, and investment viability
- **SQLite Database**: Store and manage venture data efficiently
- **REST API**: Hono-based API for interacting with the system

## Tech Stack

- **Bun**: Fast all-in-one JavaScript runtime
- **TypeScript**: Type-safe development
- **Hono**: Fast web framework
- **better-sqlite3**: Efficient SQLite database
- **Playwright**: Reliable web scraping
- **Anthropic Claude**: Advanced AI analysis

## Getting Started

### Prerequisites

- Bun runtime installed
- Anthropic API key

### Installation

1. Install dependencies:
```bash
bun install
```

2. Install Playwright browsers:
```bash
bunx playwright install chromium
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## Usage

### Start the API Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`

### Scrape a Venture

```bash
bun run scrape https://example.com
```

### Analyze Ventures

```bash
bun run analyze
```

This will analyze all ventures in the database that haven't been analyzed yet.

## API Endpoints

- `GET /` - API information
- `GET /ventures` - List all ventures
- `GET /ventures/:id` - Get venture by ID
- `POST /ventures/scrape` - Scrape a new venture
  ```json
  {
    "url": "https://example.com"
  }
  ```
- `POST /ventures/:id/analyze` - Analyze a specific venture

## Project Structure

```
src/
├── api/          # API route handlers (Hono)
├── db/           # Database models and queries (better-sqlite3)
├── scraper/      # Web scrapers (Playwright)
├── agents/       # AI analysis agents (Claude API)
└── data/         # SQLite database storage
```

## Development

The project follows clean architecture principles with modular, single-responsibility components. See [CLAUDE.md](./CLAUDE.md) for detailed coding guidelines.

## License

MIT
