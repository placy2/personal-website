import { APP_CONFIG, EXTERNAL_LINKS } from '../constants';
import type { RouteMeta } from '../data/routeMeta';

// Builds the <head> tags for one route. Called at build time by
// scripts/prerender.mjs (via the SSR bundle), which swaps the result in for
// the <!--app-head--> placeholder in index.html. All identity copy comes from
// APP_CONFIG and ROUTE_META, so retitling the site is a one-place edit.

const OG_IMAGE = `${APP_CONFIG.url}/og-image.jpeg`;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const canonicalUrl = (path: string): string => `${APP_CONFIG.url}${path}`;

// JSON.stringify doesn't escape "<", so a value containing "</script>" could
// close the tag early. < is the same character to a JSON parser.
const jsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');

export function renderHead(route: RouteMeta): string {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const url = canonicalUrl(route.path);

  const person = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: APP_CONFIG.author,
      url: APP_CONFIG.url,
      jobTitle: APP_CONFIG.jobTitle,
      description: APP_CONFIG.summary,
      image: OG_IMAGE,
      sameAs: [EXTERNAL_LINKS.GITHUB],
    },
  };

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${escapeHtml(APP_CONFIG.name)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<script type="application/ld+json">${jsonLd(person)}</script>`,
  ].join('\n    ');
}
