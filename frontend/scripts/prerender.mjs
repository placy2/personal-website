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
const siteUrl = 'https://parkerlacy.com';

const { render, ROUTE_META } = await import(path.join(rootDir, 'dist-ssr/entry-server.js'));

const escapeHtml = str =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Applies `regex` (with two capture groups bracketing the value to replace)
// to `html`, throwing if the template no longer matches — a silent no-op
// here would ship stale per-route metadata.
function replaceTagValue(html, regex, value, label) {
  if (!regex.test(html)) {
    throw new Error(`prerender: could not find ${label} in the index.html template`);
  }
  return html.replace(regex, (_match, pre, post) => `${pre}${value}${post}`);
}

function applyRouteMeta(template, route) {
  const canonicalUrl = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  let html = template;
  html = replaceTagValue(html, /(<title>)[^<]*(<\/title>)/, title, '<title>');
  html = replaceTagValue(
    html,
    /(<meta\s+name="description"\s+content=")[^"]*("\s*\/>)/,
    description,
    'meta description'
  );
  html = replaceTagValue(
    html,
    /(<link rel="canonical" href=")[^"]*("\s*\/>)/,
    canonicalUrl,
    'canonical link'
  );
  html = replaceTagValue(
    html,
    /(<meta property="og:title" content=")[^"]*("\s*\/>)/,
    title,
    'og:title'
  );
  html = replaceTagValue(
    html,
    /(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/>)/,
    description,
    'og:description'
  );
  html = replaceTagValue(
    html,
    /(<meta property="og:url" content=")[^"]*("\s*\/>)/,
    canonicalUrl,
    'og:url'
  );
  html = replaceTagValue(
    html,
    /(<meta name="twitter:title" content=")[^"]*("\s*\/>)/,
    title,
    'twitter:title'
  );
  html = replaceTagValue(
    html,
    /(<meta\s+name="twitter:description"\s+content=")[^"]*("\s*\/>)/,
    description,
    'twitter:description'
  );

  // data-prerendered-route lets main.tsx detect when it was served the wrong
  // page's static HTML (e.g. a direct load of /about served dist/index.html's
  // content as an interim SPA fallback until issue #169's CloudFront routing
  // fix lands) and fall back to a plain client render instead of hydrating
  // mismatched markup.
  const markup = render(route.path);
  const rootDivRegex = /<div id="root"><\/div>/;
  if (!rootDivRegex.test(html)) {
    throw new Error('prerender: could not find #root container in the index.html template');
  }
  html = html.replace(
    rootDivRegex,
    `<div id="root" data-prerendered-route="${escapeHtml(route.path)}">${markup}</div>`
  );

  return html;
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
    <loc>${siteUrl}${route.path === '/' ? '/' : route.path}</loc>
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
    const html = applyRouteMeta(template, route);
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
