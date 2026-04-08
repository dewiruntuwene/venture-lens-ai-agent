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

## Available AI Models

### OpenRouter Free Models (Recommended)

OpenRouter provides free access to several models using the `:free` suffix. The following models are confirmed to work:

1. **Meta Llama 3.1 8B Instruct** (Default - RECOMMENDED)
   - Model ID: `meta-llama/llama-3.1-8b-instruct:free`
   - ✅ Confirmed working
   - Fast, efficient, good quality
   - Best for structured output generation
   - 128K context window

2. **Meta Llama 3.2 3B Instruct**
   - Model ID: `meta-llama/llama-3.2-3b-instruct:free`
   - Lightweight and fast
   - Good for simple analysis
   - 128K context window

3. **Mistral 7B Instruct**
   - Model ID: `mistralai/mistral-7b-instruct:free`
   - Balanced performance
   - Good general-purpose model
   - 32K context window

4. **Google Gemma 2 9B**
   - Model ID: `google/gemma-2-9b-it:free`
   - High quality outputs
   - Good for detailed analysis
   - 8K context window

**Important:** Always use the `:free` suffix to access free models on OpenRouter.

### How to Change Models

Edit `src/ai/analyzer.ts` and update the `defaultModel` value:

```typescript
const defaultModel = useOpenRouter
  ? 'meta-llama/llama-3.1-8b-instruct:free' // Change this
  : 'claude-3-5-sonnet-20241022';
```

For the latest list of free models, visit: https://openrouter.ai/models?max_price=0

### OpenRouter Free Models (Recommended)

The following models are available for free on OpenRouter:

1. **Qwen 2.5 72B Instruct** (Default)
   - Model ID: `qwen/qwen-2.5-72b-instruct`
   - High quality, fast responses
   - Good for structured data generation

2. **DeepSeek Chat**
   - Model ID: `deepseek/deepseek-chat`
   - Efficient and accurate
   - Good for general analysis

3. **Meta Llama 3.1 8B**
   - Model ID: `meta-llama/llama-3.1-8b-instruct`
   - Fast, lightweight
   - Good for quick analysis

4. **Google Gemini Flash 1.5**
   - Model ID: `google/gemini-flash-1.5`
   - Fast and efficient
   - Good multimodal capabilities

To use a different model, you can specify it in the batch scrape command or modify the default in `src/ai/analyzer.ts`.

### How to Change Models

The default model is set in the analyzer. To use a different model, you can:

1. Edit `src/ai/analyzer.ts` and change the `defaultModel` value
2. Or use environment variables (feature can be added if needed)

For a complete list of available models, visit: https://openrouter.ai/models
