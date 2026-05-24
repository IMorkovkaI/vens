import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoMetadata } from './seo.models';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  apply(metadata: SeoMetadata): void {
    this.title.setTitle(metadata.title);
    this.updateTag('name', 'description', metadata.description);
    this.updateTag('property', 'og:title', metadata.title);
    this.updateTag('property', 'og:description', metadata.description);
    this.updateTag('property', 'og:type', metadata.type ?? 'website');
    this.updateTag('property', 'og:site_name', 'Vensight');
    this.updateTag('name', 'twitter:card', metadata.imagePath ? 'summary_large_image' : 'summary');

    if (metadata.noIndex) {
      this.updateTag('name', 'robots', 'noindex, nofollow');
    } else {
      this.updateTag('name', 'robots', 'index, follow');
    }

    if (metadata.imagePath) {
      const imageUrl = this.toAbsoluteUrl(metadata.imagePath);

      this.updateTag('property', 'og:image', imageUrl);
      this.updateTag('property', 'og:image:alt', metadata.title);
      this.updateTag('name', 'twitter:image', imageUrl);
    }

    if (metadata.canonicalPath) {
      this.setCanonical(metadata.canonicalPath);
      this.updateTag('property', 'og:url', this.toAbsoluteUrl(metadata.canonicalPath));
    }
  }

  private updateTag(attribute: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({
      [attribute]: key,
      content,
    });
  }

  private setCanonical(path: string): void {
    const href = this.toAbsoluteUrl(path);
    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', href);
  }

  private toAbsoluteUrl(path: string): string {
    const origin = this.document.location?.origin ?? 'http://localhost';

    return new URL(path, origin).toString();
  }
}
