import { describe, it, expect } from 'vitest';
import { CASE_STUDIES } from './caseStudies';
import { ROUTE_META } from './routeMeta';

// Every file under public/images/work, keyed '/public/images/work/...'. Only
// the keys are used; the loaders are never called.
const PUBLIC_WORK_FILES = new Set(
  Object.keys(import.meta.glob('/public/images/work/**/*')).map(key => key.replace(/^\/public/, ''))
);

describe('CASE_STUDIES', () => {
  it('uses unique, URL-safe slugs', () => {
    const slugs = CASE_STUDIES.map(study => study.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('keeps every summary short enough for a meta description', () => {
    for (const study of CASE_STUDIES) {
      expect(study.summary.length).toBeLessThanOrEqual(200);
    }
  });

  it('gives every case study a prerendered route with its summary as the description', () => {
    for (const study of CASE_STUDIES) {
      const meta = ROUTE_META.find(route => route.path === `/work/${study.slug}`);
      expect(meta?.description).toBe(study.summary);
    }
  });

  // /work lists work studies, then side projects, each in array order; keeping
  // side entries last makes the sitemap order match the page.
  it('keeps side projects after every work case study', () => {
    const kinds = CASE_STUDIES.map(study => study.kind ?? 'work');
    const firstSide = kinds.indexOf('side');
    if (firstSide !== -1) {
      expect(kinds.slice(firstSide).every(kind => kind === 'side')).toBe(true);
    }
  });

  it('attaches figures only after sections the study has, with real files and alt text', () => {
    for (const study of CASE_STUDIES) {
      for (const figure of study.figures ?? []) {
        expect(study[figure.after], `${study.slug}: figure after empty section`).toBeTruthy();
        expect(figure.caption.trim()).not.toBe('');
        expect(figure.images.length).toBeGreaterThanOrEqual(1);
        expect(figure.images.length).toBeLessThanOrEqual(2);
        for (const image of figure.images) {
          expect(image.src).toMatch(new RegExp(`^/images/work/${study.slug}/[\\w.-]+$`));
          expect(PUBLIC_WORK_FILES.has(image.src), `missing public file for ${image.src}`).toBe(
            true
          );
          expect(image.alt.trim()).not.toBe('');
          expect(image.width).toBeGreaterThan(0);
          expect(image.height).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('ROUTE_META', () => {
  // /projects was merged into /work. Leaving it here would prerender it,
  // list it in the sitemap and keep its head tags alive.
  it('does not include the removed /projects page', () => {
    expect(ROUTE_META.map(route => route.path)).not.toContain('/projects');
  });
});
