import {
  AiAnalysisResult as PrismaAiAnalysisResult,
  AiProvider as PrismaAiProvider,
  Prisma,
} from '../../../generated/prisma';
import { CompanyFormData } from '../../app/core/company-directory/company-directory.models';
import { AiAnalysisCacheRepository } from '../ai/ai-analysis-cache.repository.models';
import { AiAnalysisResult, AiAnalysisSource, AiProviderId } from '../ai/ai-analysis.types';
import { getPrismaClient } from './prisma.client';

export class PrismaAiAnalysisCacheRepository implements AiAnalysisCacheRepository {
  private readonly prisma = getPrismaClient();

  async getByUrl(url: string): Promise<AiAnalysisResult | undefined> {
    const analysis = await this.prisma.aiAnalysisResult.findUnique({
      where: { url },
    });

    return analysis ? this.mapAnalysis(analysis, true) : undefined;
  }

  async listRecent(limit = 10): Promise<AiAnalysisResult[]> {
    const analyses = await this.prisma.aiAnalysisResult.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return analyses.map((analysis) => this.mapAnalysis(analysis, true));
  }

  async save(result: AiAnalysisResult): Promise<AiAnalysisResult> {
    const persistedAnalysis = await this.prisma.aiAnalysisResult.upsert({
      where: { url: result.url },
      create: this.toPersistenceData(result),
      update: this.toPersistenceData(result),
    });

    return this.mapAnalysis(persistedAnalysis, false);
  }

  private toPersistenceData(
    result: AiAnalysisResult,
  ): Prisma.AiAnalysisResultUncheckedCreateInput {
    return {
      url: result.url,
      hostname: result.hostname,
      provider: this.toPrismaProvider(result.provider),
      model: result.model,
      confidence: result.confidence,
      generatedName: result.formData.name,
      generatedData: {
        formData: result.formData,
        source: result.source,
      } as unknown as Prisma.InputJsonValue,
    };
  }

  private mapAnalysis(
    analysis: PrismaAiAnalysisResult,
    fromCache: boolean,
  ): AiAnalysisResult {
    const generatedData = this.readGeneratedData(analysis.generatedData);

    return {
      url: analysis.url,
      hostname: analysis.hostname,
      formData: generatedData.formData,
      createdAt: analysis.createdAt.toISOString(),
      fromCache,
      provider: this.fromPrismaProvider(analysis.provider),
      model: analysis.model,
      confidence: analysis.confidence,
      source: generatedData.source,
    };
  }

  private readGeneratedData(value: Prisma.JsonValue): {
    formData: CompanyFormData;
    source?: AiAnalysisSource;
  } {
    if (this.isGeneratedDataEnvelope(value)) {
      const envelope = value as { formData: unknown; source?: unknown };

      return {
        formData: envelope.formData as CompanyFormData,
        source: envelope.source as AiAnalysisSource | undefined,
      };
    }

    return {
      formData: value as unknown as CompanyFormData,
    };
  }

  private isGeneratedDataEnvelope(value: Prisma.JsonValue): boolean {
    return Boolean(
      value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        'formData' in value,
    );
  }

  private toPrismaProvider(provider: AiProviderId): PrismaAiProvider {
    const providers: Record<AiProviderId, PrismaAiProvider> = {
      mock: PrismaAiProvider.MOCK,
      ollama: PrismaAiProvider.OLLAMA,
      groq: PrismaAiProvider.GROQ,
      openrouter: PrismaAiProvider.OPENROUTER,
      google: PrismaAiProvider.GOOGLE,
    };

    return providers[provider];
  }

  private fromPrismaProvider(provider: PrismaAiProvider): AiProviderId {
    return provider.toLowerCase() as AiProviderId;
  }
}
