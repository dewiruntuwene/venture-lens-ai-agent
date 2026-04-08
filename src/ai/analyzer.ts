import { initDatabase, getAllCompanies, updateCompany } from '../db/database.js';
import type { CompanyData, AnalysisOptions, AnalysisResult } from '../types/index.js';
import Anthropic from '@anthropic-ai/sdk';

export async function analyzeCompany(
  company: CompanyData,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const { model = 'claude-3-5-sonnet-20241022', maxTokens = 2048 } = options;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!anthropicKey && !openRouterKey) {
    throw new Error(
      'Either ANTHROPIC_API_KEY or OPENROUTER_API_KEY environment variable is required'
    );
  }

  const prompt = `You are a venture capital analyst. Analyze the following company description and generate structured insights.

Company Name: ${company.companyName}
Company Website: ${company.website}
Scraped Content: ${company.description}

You must return a JSON object with the following fields:
1. "industry": A specific industry classification (e.g., FinTech, HealthTech, Developer Tools, AI/ML, etc.)
2. "businessModel": The primary business model (e.g., B2B, B2C, SaaS, Marketplace, Enterprise, etc.)
3. "summary": A concise, one-sentence summary of what the company does.
4. "useCase": Relevant potential use cases for the company's product or service.
5. "analysis": A comprehensive venture capital analysis in markdown format, including:
   - Market potential
   - Competitive landscape
   - Investment viability
   - Risk factors
   - Key strengths and weaknesses

Ensure the response is valid JSON.`;

  console.log(`Analyzing company: ${company.companyName} using ${model}`);

  if (anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const msg = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a venture capital analyst that only outputs valid JSON.',
    });

    const content = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return parseLLMResponse(content);
  } else {
    // OpenRouter Fallback
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model === 'claude-3-5-sonnet-20241022' ? 'anthropic/claude-3.5-sonnet' : model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0].message.content;
    return parseLLMResponse(content);
  }
}

function parseLLMResponse(content: string): AnalysisResult {
  try {
    // Attempt to extract JSON if there is markdown preamble
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    return JSON.parse(jsonStr) as AnalysisResult;
  } catch (parseError) {
    console.error('Failed to parse LLM response as JSON:', content);
    throw new Error('Invalid JSON response from LLM');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = initDatabase();
  const companies = getAllCompanies(db);

  if (companies.length === 0) {
    console.log('No companies found in database. Please scrape some companies first.');
    db.close();
    process.exit(0);
  }

  const unanalyzedCompanies = companies.filter(
    (c: CompanyData) => !c.analysis || c.industry === 'Unknown'
  );

  if (unanalyzedCompanies.length === 0) {
    console.log('All companies have been analyzed.');
    db.close();
    process.exit(0);
  }

  console.log(`Found ${unanalyzedCompanies.length} company(ies) to analyze`);

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
        console.log(`✓ Analyzed and updated: ${company.companyName}`);
        console.log(`  Industry: ${result.industry}`);
        console.log(`  Model: ${result.businessModel}`);
        console.log('---');
      } catch (error) {
        console.error(`✗ Failed to analyze ${company.companyName}:`, error);
      }
    }

    db.close();
    console.log('\n✓ Analysis complete');
  })();
}
