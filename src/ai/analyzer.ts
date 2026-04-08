import { initDatabase, getAllCompanies, updateCompany } from '../db/database.js';
import type { CompanyData, AnalysisOptions, AnalysisResult } from '../types/index.js';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { aiLogger } from '../utils/logger.js';

// Zod schema for structured output validation
const analysisSchema = z.object({
  industry: z
    .string()
    .describe(
      'A specific industry classification (e.g., FinTech, HealthTech, Developer Tools, AI/ML, etc.)'
    ),
  businessModel: z
    .string()
    .describe('The primary business model (e.g., B2B, B2C, SaaS, Marketplace, Enterprise, etc.)'),
  summary: z.string().describe('A concise, one-sentence summary of what the company does'),
  useCase: z.string().describe("Relevant potential use cases for the company's product or service"),
  analysis: z
    .string()
    .describe(
      'A comprehensive venture capital analysis in markdown format, including market potential, competitive landscape, investment viability, risk factors, and key strengths and weaknesses'
    ),
});

export async function analyzeCompany(
  company: CompanyData,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const useOpenRouter = process.env.USE_OPENROUTER === 'true';
  // Use meta-llama/llama-3.1-8b-instruct:free - known working free model
  const defaultModel = useOpenRouter
    ? 'meta-llama/llama-3.2-3b-instruct:free'
    : 'claude-3-5-sonnet-20241022';
  const { model = defaultModel } = options;

  const prompt = `Analyze the following company description and generate structured insights.

Company Name: ${company.companyName}
Company Website: ${company.website}
Scraped Content: ${company.description}

Provide a comprehensive venture capital analysis including:
- Industry classification
- Business model
- One-sentence summary
- Potential use cases
- Detailed analysis covering market potential, competitive landscape, investment viability, risk factors, and key strengths/weaknesses`;

  aiLogger.info(
    {
      companyName: company.companyName,
      model,
      provider: useOpenRouter ? 'openrouter' : 'anthropic',
    },
    `Starting AI analysis for ${company.companyName}`
  );

  try {
    let aiModel;

    if (useOpenRouter) {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        aiLogger.error('OPENROUTER_API_KEY environment variable not set');
        throw new Error(
          'OPENROUTER_API_KEY environment variable is required when USE_OPENROUTER=true'
        );
      }

      const openrouter = createOpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });

      aiModel = openrouter(model);
      aiLogger.debug({ model }, 'Using OpenRouter with model');
    } else {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) {
        aiLogger.error('ANTHROPIC_API_KEY environment variable not set');
        throw new Error(
          'ANTHROPIC_API_KEY environment variable is required when USE_OPENROUTER=false'
        );
      }

      aiModel = anthropic(model);
      aiLogger.debug({ model }, 'Using Anthropic with model');
    }

    const { object } = await generateObject({
      model: aiModel,
      schema: analysisSchema,
      maxRetries: 5,
      prompt,
      system: 'You are a venture capital analyst providing structured company analysis.',
    });

    aiLogger.info(
      {
        companyName: company.companyName,
        industry: object.industry,
        businessModel: object.businessModel,
      },
      `Analysis completed for ${company.companyName}`
    );

    return object as AnalysisResult;
  } catch (error) {
    aiLogger.error({ error, companyName: company.companyName }, 'Failed to analyze company');
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = initDatabase();
  const companies = getAllCompanies(db);

  if (companies.length === 0) {
    aiLogger.info('No companies found in database. Please scrape some companies first.');
    db.close();
    process.exit(0);
  }

  const unanalyzedCompanies = companies.filter(
    (c: CompanyData) => !c.analysis || c.industry === 'Unknown'
  );

  if (unanalyzedCompanies.length === 0) {
    aiLogger.info('All companies have been analyzed.');
    db.close();
    process.exit(0);
  }

  aiLogger.info(
    { count: unanalyzedCompanies.length },
    `Found ${unanalyzedCompanies.length} company(ies) to analyze`
  );

  (async () => {
    for (const company of unanalyzedCompanies) {
      try {
        const result = await analyzeCompany(company);
        updateCompany(db, company.id!, {
          industry: result.industry,
          businessModel: result.businessModel,
          summary: result.summary,
          useCase: result.useCase,
          analysis: result.analysis,
        });
        aiLogger.info(
          {
            companyName: company.companyName,
            industry: result.industry,
            businessModel: result.businessModel,
          },
          `Analyzed and updated: ${company.companyName}`
        );
      } catch (error) {
        aiLogger.error(
          { error, companyName: company.companyName },
          `Failed to analyze ${company.companyName}`
        );
      }
    }

    db.close();
    aiLogger.info('Analysis complete');
  })();
}
