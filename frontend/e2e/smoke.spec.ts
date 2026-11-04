import { test, expect, Page } from '@playwright/test';
import { PROJECTS } from '../src/data/projects';
import { CASE_STUDIES } from '../src/data/caseStudies';

// Deliberately shallow: these run against the production build via
// `vite preview` and exist to prove the bundle boots and renders, not to
// exercise features.

const collectConsoleErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  return errors;
};

const routes: { path: string; heading: string }[] = [
  { path: '/', heading: 'Parker Lacy' },
  { path: '/about', heading: 'A little bit about me' },
  { path: '/work', heading: 'Work' },
  ...CASE_STUDIES.map(study => ({ path: `/work/${study.slug}`, heading: study.title })),
  { path: '/projects', heading: 'Projects' },
  { path: '/resume', heading: 'Resume' },
];

for (const { path, heading } of routes) {
  test(`${path} renders its heading`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });

  // A direct/cold load of a non-home route (as opposed to client-side nav)
  // is a full navigation, so it exercises the same fallback path a
  // bookmark, shared link, or crawler hits. Until issue #169's CloudFront
  // routing work lands, that fallback can serve the wrong prerendered page
  // (see scripts/prerender.mjs's data-prerendered-route guard) — this
  // catches a regression of that guard, which otherwise throws a silent,
  // build-passing hydration mismatch.
  test(`${path} has no console errors on a direct load`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('nav from Home to Projects shows project cards', async ({ page }) => {
  await page.goto('/');
  // exact: Playwright matches names as substrings by default, and the home
  // page's "See my projects" button would also match.
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
  for (const project of PROJECTS) {
    await expect(page.getByRole('heading', { name: project.name })).toBeVisible();
  }
});

test('nav from Home to a case study via the Work page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'See my work' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Work' })).toBeVisible();
  const [first] = CASE_STUDIES;
  await page.getByRole('link', { name: first.title }).click();
  await expect(page.getByRole('heading', { level: 1, name: first.title })).toBeVisible();
  await expect(page).toHaveTitle(`${first.title} - Parker Lacy`);
});

// Each case study is shared as its own link, so its prerendered HTML has to
// carry its own head tags (not the home page's). Requests the file directly:
// `vite preview` serves the root SPA fallback for extensionless paths, unlike
// prod's CloudFront Function (terraform/functions/rewrite-index.js), which
// rewrites /work/<slug> to this file and has its own tests.
for (const study of CASE_STUDIES) {
  test(`/work/${study.slug} serves its own meta description without JavaScript`, async ({
    request,
  }) => {
    const response = await request.get(`/work/${study.slug}/index.html`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain(
      `<meta property="og:url" content="https://parkerlacy.com/work/${study.slug}"`
    );
    expect(body).toContain(study.title);
  });
}

test('no console errors on load', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

// The actual root cause of issue #169: classification crawlers fetch HTML
// and never execute JavaScript, so the response body itself — not what
// renders after hydration — has to carry real content and metadata.
test('/ serves crawlable content without executing JavaScript', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('Parker Lacy');
  expect(body).toMatch(/<meta\s+name="description"\s+content="[^"]+"/);
});
