import { describe, it, expect } from 'vitest';
import { renderHead, canonicalUrl } from './head';
import { ROUTE_META } from '../data/routeMeta';
import { APP_CONFIG } from '../constants';

describe('renderHead', () => {
  const home = ROUTE_META.find(route => route.path === '/')!;

  it('emits the tags crawlers and the smoke tests look for', () => {
    const head = renderHead(home);
    expect(head).toContain(`<title>${APP_CONFIG.title}</title>`);
    expect(head).toMatch(/<meta\s+name="description"\s+content="[^"]+"/);
    expect(head).toContain(`<link rel="canonical" href="${canonicalUrl('/')}" />`);
  });

  it('uses each route as its own canonical and og:url', () => {
    for (const route of ROUTE_META) {
      const head = renderHead(route);
      expect(head).toContain(`<link rel="canonical" href="https://parkerlacy.com${route.path}" />`);
      expect(head).toContain(
        `<meta property="og:url" content="https://parkerlacy.com${route.path}" />`
      );
    }
  });

  it('escapes HTML in titles and descriptions', () => {
    const head = renderHead({ path: '/x', title: 'A & "B"', description: '<i>c</i>' });
    expect(head).toContain('<title>A &amp; &quot;B&quot;</title>');
    expect(head).toContain('content="&lt;i&gt;c&lt;/i&gt;"');
  });

  it('emits JSON-LD that parses and carries the job title', () => {
    const match = renderHead(home).match(/<script type="application\/ld\+json">(.*)<\/script>/);
    expect(match).not.toBeNull();
    const data = JSON.parse(match![1]);
    expect(data.mainEntity.jobTitle).toBe(APP_CONFIG.jobTitle);
  });

  it('marks case studies as articles authored by the site owner', () => {
    const study = ROUTE_META.find(route => route.path.startsWith('/work/'))!;
    const head = renderHead(study);
    expect(head).toContain('<meta property="og:type" content="article" />');
    const data = JSON.parse(head.match(/<script type="application\/ld\+json">(.*)<\/script>/)![1]);
    expect(data['@type']).toBe('Article');
    expect(data.headline).toBe(study.title);
    expect(data.author.name).toBe(APP_CONFIG.author);
  });

  it('keeps every other page a profile', () => {
    expect(renderHead(home)).toContain('<meta property="og:type" content="profile" />');
  });
});
