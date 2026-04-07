# Project: venture-lens

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Hono
- **Database**: SQLite
- **Scraper**: Playwright
- **AI**: Anthropic Claude API

## Code Style & Architecture

### General Principles

- **Clean & Modular**: Each module should have a single, well-defined responsibility
- **Named Exports Only**: Never use default exports. All exports must be named.
- **One Concern Per File**: Each file under `src/` should handle one specific concern
- **Type Safety**: Leverage TypeScript's type system fully

### Project Structure

```
src/
├── api/           # API route handlers
├── db/            # Database models, schemas, and queries
├── scrapers/      # Playwright-based web scrapers
├── ai/            # Claude API integration and prompts
├── services/      # Business logic services
├── utils/         # Shared utility functions
├── types/         # TypeScript type definitions
└── config/        # Configuration management
```

### Code Conventions

#### Exports
```typescript
// ✅ Good - Named exports
export function processData(input: string): Result {
  // ...
}

export const CONFIG = {
  // ...
};

// ❌ Bad - Default exports
export default function processData(input: string): Result {
  // ...
}
```

#### File Organization
- Each file should export related functionality for a single concern
- Keep files focused and cohesive
- Use barrel exports (index.ts) sparingly, only for public APIs

#### Naming Conventions
- **Files**: kebab-case (e.g., `user-service.ts`, `venture-scraper.ts`)
- **Functions**: camelCase (e.g., `fetchVentureData`, `processAnalysis`)
- **Classes**: PascalCase (e.g., `VentureScraper`, `DatabaseClient`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `API_TIMEOUT`)
- **Types/Interfaces**: PascalCase (e.g., `VentureData`, `ScraperOptions`)

### Database (SQLite)

- Use parameterized queries to prevent SQL injection
- Keep database logic in `src/db/`
- Use connection pooling for performance
- Define schemas and migrations clearly

### Scraping (Playwright)

- Implement robust error handling and retries
- Respect rate limits and add appropriate delays
- Use headless mode by default
- Clean up browser instances properly
- Store scraper configurations separately

### AI Integration (Claude API)

- Keep prompts in separate, maintainable files
- Implement proper error handling for API calls
- Use streaming where appropriate
- Cache responses when possible
- Handle rate limits gracefully

### Hono Framework

- Define routes clearly and RESTfully
- Use middleware for cross-cutting concerns
- Implement proper error handling middleware
- Keep route handlers thin, delegate to services

### Error Handling

- Use custom error classes for different error types
- Log errors with appropriate context
- Return meaningful error messages to clients
- Never expose sensitive information in errors

### Testing

- Write unit tests for business logic
- Integration tests for database operations
- E2E tests for critical user flows
- Mock external dependencies (API calls, database)

### Environment & Configuration

- Use environment variables for configuration
- Provide sensible defaults where appropriate
- Validate configuration at startup
- Never commit secrets or credentials

## Development Workflow

1. Keep dependencies up to date
2. Use TypeScript strict mode
3. Lint code before committing
4. Write meaningful commit messages
5. Document complex logic with comments
6. Keep functions small and focused

## Dependencies Management

- Pin major versions in package.json
- Review dependencies regularly for security updates
- Minimize dependency count where reasonable
- Prefer well-maintained libraries with active communities
