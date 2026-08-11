import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';

const API_KEY = 'test-echo-api-key-0123456789abcdef';

function fakeD1() {
  const stmt = {
    bind() { return stmt; },
    async first() { return null; },
    async all() { return { results: [] }; },
    async run() { return { success: true }; },
  };
  return { prepare() { return stmt; } };
}

function fakeKV() {
  const store = new Map();
  return {
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
  };
}

function fakeFetcher() {
  return { async fetch() { return new Response(JSON.stringify({ response: [] }), { status: 200 }); } };
}

function makeEnv(overrides = {}) {
  return {
    DB: fakeD1(),
    CACHE: fakeKV(),
    ENGINE_RUNTIME: fakeFetcher(),
    EMAIL_SENDER: fakeFetcher(),
    ECHO_API_KEY: API_KEY,
    ANALYTICS: { writeDataPoint() {} },
    ...overrides,
  };
}

async function req(path, opts = {}, env = makeEnv()) {
  const url = `https://echo-email-marketing.example${path}`;
  return worker.fetch(new Request(url, opts), env, {});
}

test('GET / is public', async () => {
  const res = await req('/');
  assert.equal(res.status, 200);
});

test('GET /health is public', async () => {
  const res = await req('/health');
  assert.equal(res.status, 200);
});

test('GET /track/open/:c/:t is public (tracking pixel)', async () => {
  const res = await req('/track/open/camp1/contact1');
  assert.equal(res.status, 200);
});

test('GET /unsubscribe/:id is public', async () => {
  const res = await req('/unsubscribe/contact1');
  assert.equal(res.status, 200);
});

test('POST /subscribe is public (rejected on validation, not auth)', async () => {
  const res = await req('/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.notEqual(body.error, 'Unauthorized');
});

test('SECURITY FIX: GET /contacts with no key is rejected 401 (was previously open to any GET)', async () => {
  const res = await req('/contacts?tenant_id=tenant-x');
  assert.equal(res.status, 401);
});

test('SECURITY FIX: GET /tenants/:id with no key is rejected 401', async () => {
  const res = await req('/tenants/tenant-x');
  assert.equal(res.status, 401);
});

test('SECURITY FIX: GET /analytics/overview with no key is rejected 401', async () => {
  const res = await req('/analytics/overview?tenant_id=tenant-x');
  assert.equal(res.status, 401);
});

test('GET /contacts with correct X-Echo-API-Key header passes auth', async () => {
  const res = await req('/contacts?tenant_id=tenant-x', { headers: { 'X-Echo-API-Key': API_KEY } });
  assert.equal(res.status, 200);
});

test('GET /tenants/:id with correct Authorization: Bearer header passes auth', async () => {
  const res = await req('/tenants/tenant-x', { headers: { Authorization: `Bearer ${API_KEY}` } });
  // Auth passed (not 401); mock DB returns no row so the handler itself 404s.
  assert.equal(res.status, 404);
});

test('GET /contacts with wrong key is rejected 401', async () => {
  const res = await req('/contacts?tenant_id=tenant-x', { headers: { 'X-Echo-API-Key': 'totally-wrong-key' } });
  assert.equal(res.status, 401);
});

test('GET /plans with no tenant identifier is the public pricing catalog', async () => {
  const res = await req('/plans');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.plans));
});

test('SECURITY: GET /plans?tenant_id=... (tenant-specific billing data) requires auth', async () => {
  const res = await req('/plans?tenant_id=tenant-x');
  assert.equal(res.status, 401);
});

test('SECURITY: GET /plans with X-Tenant-ID header (tenant-specific) requires auth', async () => {
  const res = await req('/plans', { headers: { 'X-Tenant-ID': 'tenant-x' } });
  assert.equal(res.status, 401);
});

test('GET /plans?tenant_id=... with correct key passes auth', async () => {
  const res = await req('/plans?tenant_id=tenant-x', { headers: { 'X-Echo-API-Key': API_KEY } });
  // Auth passed (not 401); mock DB returns no tenant row so the handler itself 404s.
  assert.equal(res.status, 404);
});

test('Fail-closed: protected route still 401s when ECHO_API_KEY is unset, even with a header present', async () => {
  const env = makeEnv({ ECHO_API_KEY: '' });
  const res = await req('/contacts?tenant_id=tenant-x', { headers: { 'X-Echo-API-Key': '' } }, env);
  assert.equal(res.status, 401);
});

test('Timing-shape: same-length wrong key and different-length wrong key are both rejected identically', async () => {
  const sameLength = 'x'.repeat(API_KEY.length);
  const shortKey = 'x';
  const r1 = await req('/contacts?tenant_id=tenant-x', { headers: { 'X-Echo-API-Key': sameLength } });
  const r2 = await req('/contacts?tenant_id=tenant-x', { headers: { 'X-Echo-API-Key': shortKey } });
  assert.equal(r1.status, 401);
  assert.equal(r2.status, 401);
});
