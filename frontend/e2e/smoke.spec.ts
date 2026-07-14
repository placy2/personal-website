import { test, expect, Page } from '@playwright/test';
import { PROJECTS } from '../src/data/projects';

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
  { path: '/projects', heading: 'Projects' },
  { path: '/resume', heading: 'Resume' },
];

for (const { path, heading } of routes) {
  test(`${path} renders its heading`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });
}

test('nav from Home to Projects shows project cards', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
  for (const project of PROJECTS) {
    await expect(page.getByRole('heading', { name: project.name })).toBeVisible();
  }
});

test('no console errors on load', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
