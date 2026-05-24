import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AiAnalysisService } from './ai-analysis.service';

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });
    service = TestBed.inject(AiAnalysisService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should normalize URLs and generate deterministic mock output', async () => {
    const result = await firstValueFrom(service.analyzeUrl('example-company.com/path?q=1'));

    expect(result.url).toBe('https://example-company.com/path');
    expect(result.hostname).toBe('example-company.com');
    expect(result.formData.name).toBe('Example Company');
    expect(result.formData.website).toBe('https://example-company.com/path');
    expect(result.fromCache).toBe(false);
    expect(result.provider).toBe('mock');
    expect(result.model).toBe('mock-qwen2.5-7b-profile-generator');
    expect(result.confidence).toBe(0.85);
  });

  it('should reuse cached analysis for the same normalized URL', async () => {
    const firstResult = await firstValueFrom(service.analyzeUrl('https://cached.test'));
    const secondResult = await firstValueFrom(service.analyzeUrl('cached.test/'));

    expect(secondResult.url).toBe(firstResult.url);
    expect(secondResult.createdAt).toBe(firstResult.createdAt);
    expect(secondResult.fromCache).toBe(true);
    expect(service.getCachedAnalysis('cached.test')?.formData.name).toBe('Cached');
  });

  it('should reject invalid URLs', async () => {
    await expect(firstValueFrom(service.analyzeUrl('localhost'))).rejects.toThrow(
      'Enter a valid company URL.',
    );
  });

  it('should reject plain HTTP URLs with a safe-link warning', async () => {
    await expect(firstValueFrom(service.analyzeUrl('http://example.com'))).rejects.toThrow(
      'Use an HTTPS URL so Vensight can analyze the page safely.',
    );
    await expect(firstValueFrom(service.checkSelectedProvider('http://example.com'))).rejects.toThrow(
      'Use an HTTPS URL so Vensight can analyze the page safely.',
    );
  });
});
