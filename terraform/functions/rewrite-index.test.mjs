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

test('appends index.html to directory-style paths', () => {
  assert.equal(rewrite('/'), '/index.html');
  assert.equal(rewrite('/about/'), '/about/index.html');
});

test('rewrites extensionless routes to their prerendered page', () => {
  for (const route of ['/about', '/projects', '/resume']) {
    assert.equal(rewrite(route), `${route}/index.html`);
  }
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
