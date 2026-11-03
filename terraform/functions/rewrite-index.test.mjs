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

const rewrite = uri => context.handler({ request: { uri, headers: {} } }).uri;

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
