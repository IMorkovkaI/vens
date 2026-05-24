import { hasDatabaseUrl } from '../directory/directory-repository';
import { PrismaAiAnalysisCacheRepository } from '../database/prisma-ai-analysis-cache.repository';
import { AiAnalysisCacheRepository } from './ai-analysis-cache.repository.models';
import { AiAnalysisResult } from './ai-analysis.types';

export class InMemoryAiAnalysisCacheRepository implements AiAnalysisCacheRepository {
  private readonly cache = new Map<string, AiAnalysisResult>();

  async getByUrl(url: string): Promise<AiAnalysisResult | undefined> {
    return this.cache.get(url);
  }

  async listRecent(limit = 10): Promise<AiAnalysisResult[]> {
    return [...this.cache.values()]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, limit)
      .map((analysis) => ({
        ...analysis,
        fromCache: true,
      }));
  }

  async save(result: AiAnalysisResult): Promise<AiAnalysisResult> {
    const cachedResult = {
      ...result,
      fromCache: false,
    };

    this.cache.set(result.url, cachedResult);

    return cachedResult;
  }
}

let aiAnalysisCacheRepository: AiAnalysisCacheRepository | undefined;

export function getAiAnalysisCacheRepository(): AiAnalysisCacheRepository {
  if (aiAnalysisCacheRepository) {
    return aiAnalysisCacheRepository;
  }

  aiAnalysisCacheRepository = hasDatabaseUrl()
    ? new PrismaAiAnalysisCacheRepository()
    : new InMemoryAiAnalysisCacheRepository();

  return aiAnalysisCacheRepository;
}

export function resetAiAnalysisCacheRepositoryForTests(): void {
  aiAnalysisCacheRepository = undefined;
}
