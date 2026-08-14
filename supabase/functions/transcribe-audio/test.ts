// transcribe-audio — Deno smoke test (golden + error path).
// Run: `deno test --allow-all supabase/functions/transcribe-audio/test.ts`
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const BASE = Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321';
const fnUrl = `${BASE}/functions/v1/transcribe-audio`;
const skip = Deno.env.get('SKIP_EDGE_TESTS') === '1';

Deno.test('transcribe-audio: OPTIONS returns "ok" 200', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'OPTIONS' });
  assertEquals(res.status, 200);
  assert(res.headers.get('Access-Control-Allow-Origin') === '*');
});

Deno.test('transcribe-audio: 401 without bearer', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'POST' });
  // FormData() with no audio -> still 401 first (auth gate precedes body parse).
  assertEquals(res.status, 401);
});

Deno.test('transcribe-audio: 501 not-implemented for browser provider', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const jwt = Deno.env.get('SUPABASE_TEST_JWT');
  if (!jwt) return t.skip('needs SUPABASE_TEST_JWT');
  const form = new FormData();
  form.append('audio', new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'audio/webm' }), 'clip.webm');
  form.append('language', 'en-US');
  form.append('provider', 'browser');
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  assertEquals(res.status, 501);
  const body = await res.json();
  assert(body.message.includes('not implemented'), `unexpected body: ${JSON.stringify(body)}`);
  assert(body.info.provider === 'browser');
  assert(body.info.size === 4);
});

Deno.test('transcribe-audio: 400 on missing audio field', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const jwt = Deno.env.get('SUPABASE_TEST_JWT');
  if (!jwt) return t.skip('needs SUPABASE_TEST_JWT');
  const form = new FormData();
  form.append('language', 'en-US');
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  assertEquals(res.status, 400);
  assert((await res.json()).error === 'missing_audio');
});
