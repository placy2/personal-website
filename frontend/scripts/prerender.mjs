// Runs after `vite build` (client, -> dist/) and `vite build --ssr
// src/entry-server.tsx` (-> dist-ssr/entry-server.js). Renders each route in
// ROUTE_META through react-dom/server and writes real static HTML for it, so
// crawlers that don't execute JavaScript see actual content instead of an
// empty `<div id="root">` (GH issue #169).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

const { render, renderHead, canonicalUrl, ROUTE_META } = await import(
  path.join(rootDir, 'dist-ssr/entry-server.js')
);

const HEAD_PLACEHOLDER = '<!--app-head-->';
const ROOT_DIV = '<div id="root"></div>';

// Fills index.html's two slots for one route: the <head> tags (built by
// src/seo/head.ts from ROUTE_META + APP_CONFIG) and the rendered app markup.
// Throws if either slot is missing, since a silent no-op here would ship a
// page with no title or no content.
function applyRoute(template, route) {
  for (const slot of [HEAD_PLACEHOLDER, ROOT_DIV]) {
    if (!template.includes(slot)) {
      throw new Error(`prerender: could not find ${slot} in the index.html template`);
    }
  }

  // data-prerendered-route lets main.tsx detect when it was served the wrong
  // page's static HTML (e.g. an unknown path served dist/index.html as S3's
  // 404 error document) and fall back to a plain client render instead of
  // hydrating mismatched markup. route.path comes from ROUTE_META, not user
  // input.
  const markup = render(route.path);
  return template
    .replace(HEAD_PLACEHOLDER, renderHead(route))
    .replace(ROOT_DIV, `<div id="root" data-prerendered-route="${route.path}">${markup}</div>`);
}

// SSR-rendered <img>/<script>/<link> asset URLs are a pure function of file
// content hash, so they should always match what the client build emitted —
// but if that ever drifts, fail loudly at build time instead of shipping
// broken image/script URLs that only surface once deployed.
async function assertAssetsExist(html, routePath) {
  const referenced = [...html.matchAll(/\/assets\/[\w.-]+/g)].map(m => m[0]);
  for (const assetUrl of referenced) {
    const assetPath = path.join(distDir, assetUrl);
    if (!existsSync(assetPath)) {
      throw new Error(
        `prerender: ${routePath} references ${assetUrl}, which does not exist in dist/. ` +
          'Client and SSR asset hashes have diverged.'
      );
    }
  }
}

function buildSitemap(routes) {
  const urls = routes
    .map(
      route => `  <url>
    <loc>${canonicalUrl(route.path)}</loc>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8');

  for (const route of ROUTE_META) {
    const html = applyRoute(template, route);
    await assertAssetsExist(html, route.path);

    const outPath =
      route.path === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, route.path, 'index.html');

    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, html);
    console.log(`prerendered ${route.path} -> ${path.relative(distDir, outPath)}`);
  }

  const sitemapPath = path.join(distDir, 'sitemap.xml');
  await writeFile(sitemapPath, buildSitemap(ROUTE_META));
  console.log(`generated sitemap.xml (${ROUTE_META.length} routes)`);
}

await main();
