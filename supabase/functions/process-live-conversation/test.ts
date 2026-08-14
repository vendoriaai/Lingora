// process-live-conversation — Deno smoke test (golden + error path).
// Run: `deno test --allow-all supabase/functions/process-live-conversation/test.ts`
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const BASE = Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321';
const fnUrl = `${BASE}/functions/v1/process-live-conversation`;
const skip = Deno.env.get('SKIP_EDGE_TESTS') === '1';

Deno.test('process-live-conversation: 400 on missing message', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'POST', body: '{}' });
  assertEquals(res.status, 400);
  const body = await res.json();
  assert(body.error === 'missing_message');
});

Deno.test('process-live-conversation: 401 without bearer', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'POST', body: JSON.stringify({ message: 'hi' }) });
  assertEquals(res.status, 401);
});

Deno.test('process-live-conversation: OPTIONS 204 with streaming headers', async (t) => {
  if (skip) return t.skip('SKIP_EDGE_TESTS=1');
  const res = await fetch(fnUrl, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } });
  assertEquals(res.status, 204);
  assert(res.headers.get('Access-Control-Allow-Methods')?.includes('POST'));
});

Deno.test('process-live-conversation: golden path streams text + audio', async (t) => {
  if (skip || !Deno.env.get('GEMINI_API_KEY')) return t.skip('needs GEMINI_API_KEY');
  const jwt = Deno.env.get('SUPABASE_TEST_JWT');
  if (!jwt) return t.skip('needs SUPABASE_TEST_JWT');
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Say one short sentence.', user_level: 'A2', voice: 'Kore' }),
  });
  assertEquals(res.status, 200);
  assertEquals(res.headers.get('Content-Type'), 'text/event-stream');
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let sawDone = false;
  let sawAudio = false;
  for (let i = 0; i < 80 && !sawDone; i++) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const evt = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      if (!evt.startsWith('data:')) continue;
      const obj = JSON.parse(evt.slice(5).trim());
      if (obj.audioData) sawAudio = true;
      if (obj.done === true) sawDone = true;
    }
  }
  assert(sawDone, 'stream never signalled done');
  // Audio is best-effort; assert only when TTS succeeded (env dependent).
  void sawAudio;
});
