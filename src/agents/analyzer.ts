import Anthropic from '@anthropic-ai/sdk';
import { initDatabase, getAllVentures, updateVentureAnalysis, type VentureData } from '../db/database.js';

export interface AnalysisOptions {
  model?: string;
  maxTokens?: number;
}

export async function analyzeVenture(
  venture: VentureData,
  options: AnalysisOptions = {}
): Promise<string> {
  const { model = 'claude-3-5-sonnet-20241022', maxTokens = 2048 } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a venture capital analyst. Analyze the following venture and provide insights on:
1. Market potential
2. Competitive landscape
3. Investment viability
4. Risk factors
5. Key strengths and weaknesses

Venture Information:
Name: ${venture.name}
URL: ${venture.url}
Description: ${venture.description}

Provide a structured analysis in markdown format.`;

  console.log(`Analyzing venture: ${venture.name}`);

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
  const ventures = getAllVentures(db);

  if (ventures.length === 0) {
    console.log('No ventures found in database. Please scrape some ventures first.');
    db.close();
    process.exit(0);
  }

  // Find ventures without analysis
  const unanalyzedVentures = ventures.filter((v) => !v.analysis);

  if (unanalyzedVentures.length === 0) {
    console.log('All ventures have been analyzed.');
    db.close();
    process.exit(0);
  }

  console.log(`Found ${unanalyzedVentures.length} venture(s) to analyze`);

  // Analyze ventures sequentially
  (async () => {
    for (const venture of unanalyzedVentures) {
      try {
        const analysis = await analyzeVenture(venture);
        updateVentureAnalysis(db, venture.id!, analysis);
        console.log(`✓ Analyzed: ${venture.name}`);
        console.log('---');
      } catch (error) {
        console.error(`✗ Failed to analyze ${venture.name}:`, error);
      }
    }

    db.close();
    console.log('\n✓ Analysis complete');
  })();
}
