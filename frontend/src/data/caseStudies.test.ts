import { describe, it, expect } from 'vitest';
import { CASE_STUDIES } from './caseStudies';
import { ROUTE_META } from './routeMeta';

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
});
