export interface CompanyData {
  id?: number;
  companyName: string;
  description: string;
  website: string;
  industry: string;
  businessModel: string;
  summary: string;
  useCase: string;
  scrapedAt?: string;
  analysis?: string;
}

export interface ScraperOptions {
  url: string;
  headless?: boolean;
  timeout?: number;
}

export interface AnalysisOptions {
  model?: string;
  maxTokens?: number;
}

export interface AnalysisResult {
  industry: string;
  businessModel: string;
  summary: string;
  useCase: string;
  analysis: string;
}
