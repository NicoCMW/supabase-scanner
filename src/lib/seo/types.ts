import type { BlogCategory } from "./config";

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: BlogCategory;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly keywords: readonly string[];
  readonly faqs?: readonly FaqEntry[];
  readonly body: string;
}

export interface BreadcrumbItem {
  readonly label: string;
  readonly href: string;
}
