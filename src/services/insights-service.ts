import { initDatabase, getAllCompanies, getCompanyById, updateCompany } from '../db/database.js';
import {
  generateDeepInsights,
  queryCompanyInsight,
  type DeepInsights,
} from '../ai/insight-agent.js';
import type { CompanyData } from '../types/index.js';
import { serviceLogger } from '../utils/logger.js';

export interface AggregatedInsights {
  totalCompanies: number;
  byIndustry: Record<string, number>;
  byBusinessModel: Record<string, number>;
  topIndustries: Array<{ industry: string; count: number }>;
  recentlyAnalyzed: CompanyData[];
  investmentOpportunities: Array<{
    company: string;
    recommendation: string;
    confidence: number;
  }>;
}

export async function getPortfolioInsights(): Promise<AggregatedInsights> {
  const db = initDatabase();
  try {
    const companies = getAllCompanies(db);

    // Aggregate by industry
    const byIndustry: Record<string, number> = {};
    const byBusinessModel: Record<string, number> = {};

    companies.forEach((company) => {
      if (company.industry && company.industry !== 'Unknown') {
        byIndustry[company.industry] = (byIndustry[company.industry] || 0) + 1;
      }
      if (company.businessModel && company.businessModel !== 'Unknown') {
        byBusinessModel[company.businessModel] = (byBusinessModel[company.businessModel] || 0) + 1;
      }
    });

    // Top industries
    const topIndustries = Object.entries(byIndustry)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recently analyzed (last 10)
    const recentlyAnalyzed = companies.filter((c) => c.analysis).slice(0, 10);

    // Mock investment opportunities (would parse from actual deep insights)
    const investmentOpportunities = companies
      .filter((c) => c.analysis)
      .slice(0, 5)
      .map((c) => ({
        company: c.companyName,
        recommendation: 'Pending Deep Analysis',
        confidence: 0,
      }));

    return {
      totalCompanies: companies.length,
      byIndustry,
      byBusinessModel,
      topIndustries,
      recentlyAnalyzed,
      investmentOpportunities,
    };
  } finally {
    db.close();
  }
}

export async function generateAndStoreDeepInsights(companyId: number): Promise<DeepInsights> {
  const db = initDatabase();
  try {
    const company = getCompanyById(db, companyId);
    if (!company) {
      serviceLogger.error({ companyId }, 'Company not found for deep insights');
      throw new Error(`Company with ID ${companyId} not found`);
    }

    serviceLogger.info(
      { companyId, companyName: company.companyName },
      'Starting deep insights generation'
    );
    const insights = await generateDeepInsights(company);

    // Store insights as JSON in analysis field
    const analysisJson = JSON.stringify(insights, null, 2);
    updateCompany(db, companyId, { analysis: analysisJson });

    serviceLogger.info(
      {
        companyId,
        companyName: company.companyName,
        recommendation: insights.investmentRecommendation.recommendation,
      },
      'Deep insights stored successfully'
    );
    return insights;
  } finally {
    db.close();
  }
}

export async function askCompanyQuestion(companyId: number, question: string): Promise<string> {
  const db = initDatabase();
  try {
    const company = getCompanyById(db, companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    return await queryCompanyInsight(company, question);
  } finally {
    db.close();
  }
}

export async function batchAnalyzeCompanies(
  companyIds: number[],
  deepAnalysis: boolean = false
): Promise<Array<{ id: number; status: string; error?: string }>> {
  const results = [];

  for (const id of companyIds) {
    try {
      if (deepAnalysis) {
        await generateAndStoreDeepInsights(id);
        results.push({ id, status: 'success' });
      } else {
        // Basic analysis already exists via analyzeCompany
        results.push({ id, status: 'success' });
      }
    } catch (error) {
      results.push({
        id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function compareCompanies(companyIds: number[]): Promise<{
  companies: CompanyData[];
  comparison: string;
}> {
  const db = initDatabase();
  try {
    const companies = companyIds
      .map((id) => getCompanyById(db, id))
      .filter((c): c is CompanyData => c !== undefined);

    if (companies.length < 2) {
      throw new Error('At least 2 companies required for comparison');
    }

    // Use AI to generate comparison
    const companyInfo = companies
      .map(
        (c, i) => `
Company ${i + 1}: ${c.companyName}
Industry: ${c.industry}
Business Model: ${c.businessModel}
Summary: ${c.summary}
Use Case: ${c.useCase}
`
      )
      .join('\n---\n');

    const comparison = await queryCompanyInsight(
      companies[0],
      `Compare the following companies and provide a detailed comparative analysis highlighting strengths, weaknesses, market positioning, and investment potential:\n\n${companyInfo}`
    );

    return { companies, comparison };
  } finally {
    db.close();
  }
}
