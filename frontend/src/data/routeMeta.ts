import { APP_CONFIG, ROUTES } from '../constants';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
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
    description: APP_CONFIG.description[0],
  },
  {
    path: ROUTES.ABOUT,
    title: `About - ${APP_CONFIG.author}`,
    description:
      "Parker Lacy's background: a Computer Science degree from Trinity University, a start in tech consulting, and a move into cloud engineering and DevOps.",
  },
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
