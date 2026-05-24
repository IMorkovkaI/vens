import { AiAnalysisResult } from './ai-analysis.types';

export interface AiAnalysisCacheRepository {
  getByUrl(url: string): Promise<AiAnalysisResult | undefined>;
  listRecent(limit?: number): Promise<AiAnalysisResult[]>;
  save(result: AiAnalysisResult): Promise<AiAnalysisResult>;
}
