import type { Page } from '../types';
import { BLOG_ARTICLES } from '../data/blogArticles';

export const SITE_URL = 'https://prontocurriculum.it';

const BLOG_SLUGS = new Set(BLOG_ARTICLES.map((a) => a.slug));

// Static, non-blog paths. Auth-gated app pages (dashboard, archivio,
// candidature, admin, referral) still get a real path for deep-linking,
// but are excluded from the sitemap and disallowed in robots.txt.
const STATIC_PATH_TO_PAGE: Record<string, Page> = {
  '/': 'home',
  '/blog': 'blog',
  '/calcolo-stipendio': 'calcolo-stipendio',
  '/privacy': 'privacy',
  '/termini': 'terms',
  '/cookie': 'cookie',
  '/crea-cv': 'builder-step1',
  '/crea-cv/editor': 'builder-step2',
  '/cv-su-misura': 'tailor',
  '/genera-lettera-presentazione': 'cover-letter',
  '/concorsi-pubblici': 'concorsi',
  '/offerte-lavoro': 'jobs',
  '/prezzi': 'prezzi',
  '/come-funziona': 'come-funziona',
  '/archivio': 'archivio',
  '/candidature': 'candidature',
  '/dashboard': 'dashboard',
  '/referral': 'referral',
  '/admin': 'admin',
};

const STATIC_PAGE_TO_PATH: Partial<Record<Page, string>> = Object.fromEntries(
  Object.entries(STATIC_PATH_TO_PAGE).map(([path, page]) => [page, path]),
);

/** Maps a URL pathname to { page, slug } app state on load or popstate. */
export function pathToPage(pathname: string): { page: Page; slug?: string } {
  const path = pathname.replace(/\/+$/, '') || '/';
  const slugCandidate = path.startsWith('/') ? path.slice(1) : path;

  if (BLOG_SLUGS.has(slugCandidate)) {
    return { page: 'blog-article', slug: slugCandidate };
  }

  const page = STATIC_PATH_TO_PAGE[path];
  if (page) return { page };

  return { page: 'home' };
}

/** Maps app state to the canonical URL path, for pushState + <link rel="canonical">. */
export function pageToPath(page: Page, slug?: string): string {
  if (page === 'blog-article' && slug) return `/${slug}`;
  return STATIC_PAGE_TO_PATH[page] ?? '/';
}

export function canonicalUrl(page: Page, slug?: string): string {
  return `${SITE_URL}${pageToPath(page, slug)}`;
}
