import Anthropic from '@anthropic-ai/sdk';
import {
  initDatabase,
  getAllCompanies,
  updateCompanyAnalysis,
  type CompanyData,
} from '../db/database.js';

export interface AnalysisOptions {
  model?: string;
  maxTokens?: number;
}

export async function analyzeCompany(
  company: CompanyData,
  options: AnalysisOptions = {}
): Promise<string> {
  const { model = 'claude-3-5-sonnet-20241022', maxTokens = 2048 } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a venture capital analyst. Analyze the following company and provide insights on:
1. Market potential
2. Competitive landscape
3. Investment viability
4. Risk factors
5. Key strengths and weaknesses

Company Information:
Name: ${company.companyName}
Website: ${company.website}
Description: ${company.description}
Industry: ${company.industry}
Business Model: ${company.businessModel}
Summary: ${company.summary}
Use Case: ${company.useCase}

Provide a structured analysis in markdown format.`;

  console.log(`Analyzing company: ${company.companyName}`);

  try {
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const analysis = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
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

  // Find companies without analysis
  const unanalyzedCompanies = companies.filter((c: CompanyData) => !c.analysis);

  if (unanalyzedCompanies.length === 0) {
    console.log('All companies have been analyzed.');
    db.close();
    process.exit(0);
  }

  console.log(`Found ${unanalyzedCompanies.length} company(ies) to analyze`);

  // Analyze companies sequentially
  (async () => {
    for (const company of unanalyzedCompanies) {
      try {
        const analysis = await analyzeCompany(company);
        updateCompanyAnalysis(db, company.id!, analysis);
        console.log(`✓ Analyzed: ${company.companyName}`);
        console.log('---');
      } catch (error) {
        console.error(`✗ Failed to analyze ${company.companyName}:`, error);
      }
    }

    db.close();
    console.log('\n✓ Analysis complete');
  })();
}
