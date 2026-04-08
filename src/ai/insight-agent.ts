import { generateObject, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { CompanyData } from '../types/index.js';
import { aiLogger } from '../utils/logger.js';

// Detailed competitive analysis schema
const competitiveAnalysisSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      differentiator: z.string(),
    })
  ),
  marketPosition: z.string(),
  competitiveAdvantage: z.string(),
  threats: z.array(z.string()),
});

// Financial viability schema
const financialViabilitySchema = z.object({
  revenueModel: z.string().describe('Primary revenue generation strategy'),
  scalability: z.string().describe('How the business can scale'),
  burnRate: z.string().describe('Estimated cash burn characteristics'),
  fundingStage: z.string().describe('Likely funding stage (Seed, Series A, etc.)'),
  monetizationStrategy: z.string(),
});

// Market analysis schema
const marketAnalysisSchema = z.object({
  marketSize: z.string().describe('Total addressable market estimation'),
  growthRate: z.string().describe('Market growth trajectory'),
  targetCustomers: z.array(z.string()).describe('Primary customer segments'),
  marketTrends: z.array(z.string()),
  barriers: z.array(z.string()).describe('Entry barriers'),
});

// Risk assessment schema
const riskAssessmentSchema = z.object({
  technicalRisks: z.array(z.string()),
  marketRisks: z.array(z.string()),
  executionRisks: z.array(z.string()),
  regulatoryRisks: z.array(z.string()),
  overallRiskScore: z.number().min(1).max(10).describe('Risk score from 1-10'),
});

// Investment recommendation schema
const investmentRecommendationSchema = z.object({
  recommendation: z.enum(['Strong Buy', 'Buy', 'Hold', 'Pass', 'Avoid']),
  confidence: z.number().min(0).max(100).describe('Confidence percentage'),
  keyStrengths: z.array(z.string()),
  keyWeaknesses: z.array(z.string()),
  suggestedValuation: z.string(),
  investmentThesis: z.string(),
});

export interface DeepInsights {
  competitiveAnalysis: z.infer<typeof competitiveAnalysisSchema>;
  financialViability: z.infer<typeof financialViabilitySchema>;
  marketAnalysis: z.infer<typeof marketAnalysisSchema>;
  riskAssessment: z.infer<typeof riskAssessmentSchema>;
  investmentRecommendation: z.infer<typeof investmentRecommendationSchema>;
  executiveSummary: string;
}

export async function generateDeepInsights(
  company: CompanyData,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<DeepInsights> {
  const baseContext = `
Company Name: ${company.companyName}
Website: ${company.website}
Industry: ${company.industry}
Business Model: ${company.businessModel}
Summary: ${company.summary}
Description: ${company.description}
`;

  aiLogger.info(
    { companyName: company.companyName },
    'Starting deep insights generation with 5 parallel agents'
  );

  // Run multiple specialized agents in parallel
  const startTime = Date.now();
  const [competitive, financial, market, risk, recommendation] = await Promise.all([
    // Agent 1: Competitive Analysis
    generateObject({
      model: anthropic(model),
      schema: competitiveAnalysisSchema,
      prompt: `${baseContext}\n\nConduct a comprehensive competitive analysis. Identify key competitors, market positioning, competitive advantages, and threats.`,
      system:
        'You are a competitive intelligence analyst specializing in market positioning and competitor research.',
    }),

    // Agent 2: Financial Viability
    generateObject({
      model: anthropic(model),
      schema: financialViabilitySchema,
      prompt: `${baseContext}\n\nAnalyze the financial viability and revenue potential. Assess the business model, scalability, and monetization strategy.`,
      system: 'You are a financial analyst specializing in startup economics and revenue modeling.',
    }),

    // Agent 3: Market Analysis
    generateObject({
      model: anthropic(model),
      schema: marketAnalysisSchema,
      prompt: `${baseContext}\n\nConduct a thorough market analysis. Estimate market size, growth rate, target customers, trends, and entry barriers.`,
      system:
        'You are a market research analyst specializing in TAM/SAM/SOM analysis and market trends.',
    }),

    // Agent 4: Risk Assessment
    generateObject({
      model: anthropic(model),
      schema: riskAssessmentSchema,
      prompt: `${baseContext}\n\nPerform a comprehensive risk assessment covering technical, market, execution, and regulatory risks. Provide an overall risk score.`,
      system: 'You are a risk analyst specializing in venture capital due diligence.',
    }),

    // Agent 5: Investment Recommendation
    generateObject({
      model: anthropic(model),
      schema: investmentRecommendationSchema,
      prompt: `${baseContext}\n\nProvide an investment recommendation with confidence level, key strengths/weaknesses, suggested valuation, and investment thesis.`,
      system: 'You are a senior VC partner making investment decisions.',
    }),
  ]);

  const agentDuration = Date.now() - startTime;
  aiLogger.info(
    { companyName: company.companyName, duration: `${agentDuration}ms` },
    'All 5 specialized agent analyses complete'
  );

  // Generate executive summary synthesizing all insights
  aiLogger.debug({ companyName: company.companyName }, 'Synthesizing executive summary');
  const { text: executiveSummary } = await generateText({
    model: anthropic(model),
    prompt: `Based on the following analyses, create a concise 2-3 paragraph executive summary for investors:

Competitive Analysis: ${JSON.stringify(competitive.object)}
Financial Viability: ${JSON.stringify(financial.object)}
Market Analysis: ${JSON.stringify(market.object)}
Risk Assessment: ${JSON.stringify(risk.object)}
Investment Recommendation: ${JSON.stringify(recommendation.object)}

Synthesize these insights into a compelling executive summary.`,
    system:
      'You are an expert at writing concise, compelling executive summaries for VC investment memos.',
  });

  const totalDuration = Date.now() - startTime;
  aiLogger.info(
    {
      companyName: company.companyName,
      totalDuration: `${totalDuration}ms`,
      recommendation: recommendation.object.recommendation,
      riskScore: risk.object.overallRiskScore,
    },
    'Deep insights generation complete'
  );

  return {
    competitiveAnalysis: competitive.object,
    financialViability: financial.object,
    marketAnalysis: market.object,
    riskAssessment: risk.object,
    investmentRecommendation: recommendation.object,
    executiveSummary,
  };
}

// Quick insights for specific questions
export async function queryCompanyInsight(
  company: CompanyData,
  question: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  const { text } = await generateText({
    model: anthropic(model),
    prompt: `Company Information:
Name: ${company.companyName}
Website: ${company.website}
Industry: ${company.industry}
Business Model: ${company.businessModel}
Summary: ${company.summary}
Description: ${company.description}
${company.analysis ? `Previous Analysis: ${company.analysis}` : ''}

Question: ${question}

Provide a detailed, data-driven answer.`,
    system:
      'You are a venture capital analyst answering specific questions about companies with expertise and precision.',
  });

  return text;
}
