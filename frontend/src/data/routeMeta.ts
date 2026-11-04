import { APP_CONFIG, ROUTES, workPath } from '../constants';
import { CASE_STUDIES } from './caseStudies';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  // Open Graph / JSON-LD page type. Defaults to 'profile'; case studies are
  // 'article' so link previews and search treat them as standalone write-ups.
  type?: 'profile' | 'article';
}

/**
 * Single source of truth for per-route <title>/description/canonical, consumed by
 * the prerender script, the generated sitemap, and client-side title sync on
 * navigation (see App.tsx). Keep in sync with the routes defined in App.tsx.
 */
export const ROUTE_META: RouteMeta[] = [
  {
    path: ROUTES.HOME,
    title: APP_CONFIG.title,
    description: APP_CONFIG.summary,
  },
  {
    path: ROUTES.ABOUT,
    title: `About - ${APP_CONFIG.author}`,
    description:
      "Parker Lacy's background: a Computer Science degree from Trinity University, a start in tech consulting, and a move into cloud engineering and DevOps.",
  },
  {
    path: ROUTES.WORK,
    title: `Work - ${APP_CONFIG.author}`,
    description:
      'Short case studies of platform work Parker Lacy has led: what the problem was, what he built, and what changed.',
  },
  // One page per case study; the summary doubles as the meta description.
  ...CASE_STUDIES.map(study => ({
    path: workPath(study.slug),
    title: `${study.title} - ${APP_CONFIG.author}`,
    description: study.summary,
    type: 'article' as const,
  })),
  {
    path: ROUTES.PROJECTS,
    title: `Projects - ${APP_CONFIG.author}`,
    description:
      "A collection of Parker Lacy's public projects, including this site's own Terraform-provisioned AWS infrastructure.",
  },
  {
    path: ROUTES.RESUME,
    title: `Resume - ${APP_CONFIG.author}`,
    description: "Request a copy of Parker Lacy's resume.",
  },
];
