import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../core/seo/seo.service';
import { DataSourcesPageComponent } from './data-sources-page.component';

describe('DataSourcesPageComponent', () => {
  it('uses standalone source headings and matching policy buttons in centered prose', () => {
    TestBed.configureTestingModule({
      imports: [DataSourcesPageComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: { apply: () => undefined } }],
    });
    const fixture = TestBed.createComponent(DataSourcesPageComponent);
    fixture.detectChanges();
    const steps = fixture.nativeElement.querySelectorAll('.source-step') as NodeListOf<HTMLElement>;
    expect(steps.length).toBe(3);
    steps.forEach((step) => {
      const header = step.querySelector('header');
      expect(header?.querySelector('.eyebrow')).toBeNull();
      expect(header?.querySelector('h2')).toBeTruthy();
      expect(step.querySelector(':scope > p')).toBeTruthy();
    });
    const prose = fixture.nativeElement.querySelector('.prose-content') as HTMLElement;
    expect(prose.classList.contains('lg:mx-auto')).toBeTrue();
    const privacy = prose.querySelector('a[href="/legal/privacy"]');
    const terms = prose.querySelector('a[href="/legal/terms"]');
    expect(privacy?.classList.contains('btn-secondary')).toBeTrue();
    expect(terms?.className).toBe(privacy?.className);
  });
});
