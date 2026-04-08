# Venture Lens AI Agent - Bruno API Collection

This Bruno collection contains ready-to-use API requests for the Venture Lens AI Agent.

## 📋 Available Requests

### 1. Health Check

- **GET** `/`
- Returns API status and available endpoints

### 2. List Companies

- **GET** `/companies`
- Returns all companies in the database

### 3. Filter by Industry

- **GET** `/companies?industry=FinTech`
- Filter companies by specific industry
- Example industries: FinTech, HealthTech, AI/ML, Developer Tools, SaaS

### 4. Search by Keyword

- **GET** `/companies?search=blockchain`
- Search companies by keyword across all fields
- Example keywords: blockchain, payment, chatbot, ai, health

### 5. Filter AI/ML Companies

- **GET** `/companies?industry=AI/ML`
- Quick filter for AI/ML companies

### 6. Filter HealthTech Companies

- **GET** `/companies?industry=HealthTech`
- Quick filter for HealthTech companies

## 🚀 Getting Started

1. **Install Bruno**: https://www.usebruno.com/downloads

2. **Start the API server**:

   ```bash
   bun run dev
   ```

3. **Open this collection in Bruno**:
   - File → Open Collection
   - Select the `bruno` folder

4. **Select the local environment**:
   - Click on the environment dropdown
   - Select "local"

5. **Run requests**:
   - Click on any request
   - Click "Send" button

## 🔧 Environment Variables

The collection uses the following environment variable:

- `base_url`: http://localhost:3000 (default for local development)

You can modify this in `bruno/environments/local.bru`

## 📝 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "companyName": "Example Co",
      "description": "Company description",
      "website": "https://example.com",
      "industry": "FinTech",
      "businessModel": "B2B SaaS",
      "summary": "One-sentence summary",
      "useCase": "Potential use cases",
      "scrapedAt": "2026-04-08T10:00:00Z",
      "analysis": "Full AI analysis..."
    }
  ],
  "filters": {
    "industry": "FinTech",
    "search": null
  }
}
```

## 💡 Tips

- **Customize filters**: Edit the query parameters in each request
- **Try different industries**: Common values include FinTech, HealthTech, AI/ML, Developer Tools, SaaS, E-commerce
- **Search is flexible**: Partial matches work (searching "block" will find "blockchain")
- **Case sensitivity**: Industry filter is case-sensitive, search is case-insensitive
