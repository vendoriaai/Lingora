// process-gemini-chat — Deno smoke test (golden + error path).
// Run: `deno test --allow-all supabase/functions/process-gemini-chat/test.ts`
// Requires a running local Supabase; CI gates the gemini-call test on GEMINI_API_KEY.
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const BASE = Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321';
const fnUrl = `${BASE}/functions/v1/process-gemini-chat`;
const hasGemini = !!Deno.env.get('GEMINI_API_KEY');
// Skip caller tests if the function isn't reachable (CI starts Supabase first).
const skip = Deno.env.get('SKIP_EDGE_TESTS') === '1';

Deno.test('process-gemini-chat: 400 on missing message', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'POST', body: '{}' });
  assertEquals(res.status, 400);
  const body = await res.json();
  assert(body.error === 'missing_message', `unexpected body: ${JSON.stringify(body)}`);
});

Deno.test('process-gemini-chat: 401 without bearer', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'POST', body: JSON.stringify({ message: 'hi' }) });
  assertEquals(res.status, 401);
});

Deno.test('process-gemini-chat: 400 on invalid JSON', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'POST', body: 'not-json' });
  assertEquals(res.status, 400);
});

Deno.test('process-gemini-chat: OPTIONS preflight 204 + CORS', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:5173' },
  });
  assertEquals(res.status, 204);
  assert(res.headers.get('Access-Control-Allow-Methods')?.includes('POST'));
});

Deno.test('process-gemini-chat: golden path streams SSE', async (t) => {
  if (skip || !hasGemini) return t.skip('needs GEMINI_API_KEY');
  // Need a valid Supabase user JWT; CI injects SUPABASE_TEST_JWT.
  const jwt = Deno.env.get('SUPABASE_TEST_JWT');
  if (!jwt) return t.skip('needs SUPABASE_TEST_JWT');
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Say hello in 5 words.', user_level: 'B1', focus_area: 'conversation' }),
  });
  assertEquals(res.status, 200);
  assertEquals(res.headers.get('Content-Type'), 'text/event-stream');
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let sawContent = false;
  let sawDone = false;
  for (let i = 0; i < 50 && !(sawDone); i++) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const evt = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      if (!evt.startsWith('data:')) continue;
      const obj = JSON.parse(evt.slice(5).trim());
      if (obj.content) sawContent = true;
      if (obj.done === true) sawDone = true;
    }
  }
  assert(sawDone, 'stream never signalled done');
  assert(sawContent, 'stream never produced content');
});
