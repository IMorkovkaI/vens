export interface SeoMetadata {
  title: string;
  description: string;
  canonicalPath?: string;
  imagePath?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
}
