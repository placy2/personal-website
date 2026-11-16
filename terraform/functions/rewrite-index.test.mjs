// Run with: node --test terraform/functions/*.test.mjs
// Loads the CloudFront Function source as-is (it's a plain script, not a
// module) and exercises its handler with the same event shape CloudFront uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./rewrite-index.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

const handle = (uri, host) =>
  context.handler({
    request: { uri, headers: host ? { host: { value: host } } : {}, querystring: {} },
  });
const rewrite = uri => handle(uri, 'parkerlacy.com').uri;

test('redirects www to the apex with a 301, keeping the path', () => {
  for (const [uri, location] of [
    ['/', 'https://parkerlacy.com/'],
    ['/about', 'https://parkerlacy.com/about'],
    ['/work/some-slug/', 'https://parkerlacy.com/work/some-slug/'],
    ['/robots.txt', 'https://parkerlacy.com/robots.txt'],
  ]) {
    const response = handle(uri, 'www.parkerlacy.com');
    assert.equal(response.statusCode, 301);
    assert.equal(response.headers.location.value, location);
  }
  assert.equal(
    handle('/about', 'WWW.ParkerLacy.com').headers.location.value,
    'https://parkerlacy.com/about'
  );
});

test('does not redirect the apex, the CloudFront domain, or a missing Host', () => {
  assert.equal(handle('/about', 'parkerlacy.com').statusCode, undefined);
  assert.equal(handle('/about', 'd1234abcd.cloudfront.net').uri, '/about/index.html');
  assert.equal(handle('/about').uri, '/about/index.html');
});

// The S3 REST origin has no index document, so every page (including /) is
// served only because of this rewrite.
test('appends index.html to directory-style paths', () => {
  assert.equal(rewrite('/'), '/index.html');
  assert.equal(rewrite('/about/'), '/about/index.html');
  assert.equal(rewrite('/work/'), '/work/index.html');
  assert.equal(rewrite('/work/some-slug/'), '/work/some-slug/index.html');
});

test('rewrites extensionless routes to their prerendered page', () => {
  for (const route of ['/about', '/work', '/work/some-slug', '/resume']) {
    assert.equal(rewrite(route), `${route}/index.html`);
  }
});

test('301s /projects and /projects/ to /work with a relative Location', () => {
  for (const uri of ['/projects', '/projects/']) {
    for (const host of ['parkerlacy.com', 'd1234abcd.cloudfront.net', undefined]) {
      const response = handle(uri, host);
      assert.equal(response.statusCode, 301);
      assert.equal(response.statusDescription, 'Moved Permanently');
      assert.equal(response.headers.location.value, '/work');
      assert.equal(response.headers['cache-control'].value, 'max-age=86400');
    }
  }
});

test('www + /projects redirects straight to the apex /work in one hop', () => {
  for (const uri of ['/projects', '/projects/']) {
    const response = handle(uri, 'www.parkerlacy.com');
    assert.equal(response.statusCode, 301);
    assert.equal(response.headers.location.value, 'https://parkerlacy.com/work');
  }
});

test('does not redirect other paths under or near /projects', () => {
  assert.equal(rewrite('/projects/old-slug'), '/projects/old-slug/index.html');
  assert.equal(rewrite('/projectsx'), '/projectsx/index.html');
  assert.equal(rewrite('/projects/index.html'), '/projects/index.html');
});

test('leaves real files alone', () => {
  for (const uri of [
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.svg',
    '/assets/index-CITQPPKK.js',
    '/.well-known/security.txt',
  ]) {
    assert.equal(rewrite(uri), uri);
  }
});

test('only looks at the last path segment for an extension', () => {
  assert.equal(rewrite('/v1.2/notes'), '/v1.2/notes/index.html');
});
