// verify-schema.ts — assert the live/dev Postgres matches 0000_init.sql.
// Source: docs/14-TESTING-STRATEGY.md §5. Parses the migration to build the
// expected artifact set (tables, columns, indexes, policies, RLS state,
// functions, triggers), introspects the database, and fails on any drift.
//
// Usage: DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres npm run verify-schema
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(__dirname, '..', 'supabase', 'migrations', '0000_init.sql');
const sql = readFileSync(MIGRATION_PATH, 'utf8');

// ─────────────────────────── parse the migration ───────────────────────────

interface TableBlock { name: string; head: number; }

/** Find `create table public.<name> (` and the index of the char after `(`. */
function findCreateTables(src: string): TableBlock[] {
  const re = /create\s+table\s+public\.(\w+)\s*\(/gi;
  const out: TableBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    out.push({ name: m[1], head: m.index + m[0].length });
  }
  return out;
}

/** From an open-paren position, scan to its matching close paren (depth-aware). */
function matchParen(src: string, open: number): number {
  let depth = 1;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i; }
  }
  throw new Error('unbalanced parens in migration');
}

/** Extract column names from a table body by splitting on top-level commas,
 *  stripping `--` comments, and taking the first identifier of each segment
 *  unless it's a table-level constraint keyword. */
function columnsFromBody(body: string): string[] {
  const segments: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) { segments.push(body.slice(start, i)); start = i + 1; }
  }
  segments.push(body.slice(start));

  const cols: string[] = [];
  const tableConstraints = new Set(['constraint', 'primary', 'unique', 'check', 'foreign', 'exclude']);
  for (const seg of segments) {
    // Strip `-- ...` line comments, drop pure-comment lines.
    const lines = seg.split('\n').map((l) => l.replace(/--.*$/, ''));
    const cleaned = lines.join(' ').trim();
    if (!cleaned) continue;
    const first = cleaned.match(/^(\w+)/);
    if (!first) continue;
    const tok = first[1].toLowerCase();
    if (tableConstraints.has(tok)) continue; // table-level constraint, not a column
    cols.push(first[1]);
  }
  return cols;
}

const tables = findCreateTables(sql);
const expectedTables = new Set(tables.map((t) => t.name));
const expectedColumns = new Map<string, Set<string>>();
for (const t of tables) {
  const open = t.head;
  const close = matchParen(sql, open);
  const body = sql.slice(open, close);
  expectedColumns.set(t.name, new Set(columnsFromBody(body)));
}

function captureGroups(re: RegExp, src: string, group: (m: RegExpExecArray) => string | null): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(src)) !== null) {
    const g = group(m);
    if (g) out.push(g);
  }
  return out;
}

const expectedIndexes = new Set(
  captureGroups(/create\s+(?:unique\s+)?index\s+(\w+)\s+on\s+public\.\w+/i, sql, (m) => m[1]),
);
// Policies span public.* (RLS) and storage.objects (bucket rules). Capture the
// full schema.table qualifier so live introspection can scope by schema.
const expectedPolicies = new Set(
  captureGroups(/create\s+policy\s+"([^"]+)"\s+on\s+(\w+)\.(\w+)/i, sql, (m) => `${m[2]}.${m[3]}::${m[1]}`),
);
const expectedFunctions = new Set(
  captureGroups(/create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\(/i, sql, (m) => m[1]),
);
// Triggers: verify every public-schema update trigger we declare. The single
// auth-schema trigger (on_auth_user_created on auth.users) is Supabase-managed
// and may not exist on freshly-linked projects, so it is intentionally excluded.
const expectedTriggers = new Set(
  captureGroups(/create\s+trigger\s+(\w+)\s+(?:before|after)\s+(?:insert|update|delete)\s+on\s+public\.(\w+)/i, sql, (m) => `${m[2]}::${m[1]}`),
);

// ─────────────────────────── introspect the database ───────────────────────

// `--print-expected` exits after parsing the migration — validates the parser
// without needing a live DB. CI uses it as a sanity check on the parsed counts.
if (process.argv.includes('--print-expected')) {
  console.log('verify-schema: parsed expectations from 0000_init.sql');
  console.log(`  tables    : ${expectedTables.size}`);
  console.log(`  columns   : ${[...expectedColumns.values()].reduce((n, s) => n + s.size, 0)}`);
  console.log(`  indexes   : ${expectedIndexes.size}`);
  console.log(`  policies  : ${expectedPolicies.size}`);
  console.log(`  functions : ${expectedFunctions.size}`);
  console.log(`  triggers  : ${expectedTriggers.size}`);
  console.log(`  tables list: ${[...expectedTables].sort().join(', ')}`);
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('verify-schema: DATABASE_URL not set.');
  console.error('  Local dev:  DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres npm run verify-schema');
  console.error('  CI:         set DATABASE_URL to the Supabase direct connection string.');
  process.exit(process.env.CI === 'true' ? 1 : 0);
}

interface Counts { missing: number; extra: number; }
const report: Counts = { missing: 0, extra: 0 };
const missingLines: string[] = [];

function fail(msg: string) { report.missing++; missingLines.push(msg); }
function note(msg: string) { report.extra++; console.warn(`  extra: ${msg}`); }

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const q = pool.query.bind(pool);

  const [tablesRes, colsRes, idxRes, polRes, rlsRes, fnRes, trgRes] = await Promise.all([
    q("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'"),
    q("select table_name, column_name from information_schema.columns where table_schema='public'"),
    q("select indexname from pg_indexes where schemaname='public'"),
    q("select schemaname, tablename, policyname from pg_policies where schemaname in ('public','storage')"),
    q("select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'"),
    q("select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'"),
    q("select c.relname, t.tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal"),
  ]);

  const liveTables = new Set(tablesRes.rows.map((r: { table_name: string }) => r.table_name));
  const liveColumns = new Map<string, Set<string>>();
  for (const r of colsRes.rows as Array<{ table_name: string; column_name: string }>) {
    if (!liveColumns.has(r.table_name)) liveColumns.set(r.table_name, new Set());
    liveColumns.get(r.table_name)!.add(r.column_name);
  }
  const liveIndexes = new Set(idxRes.rows.map((r: { indexname: string }) => r.indexname));
  const livePolicies = new Set(polRes.rows.map((r: { schemaname: string; tablename: string; policyname: string }) => `${r.schemaname}.${r.tablename}::${r.policyname}`));
  const liveRls = new Map<string, { security: boolean; forced: boolean }>();
  for (const r of rlsRes.rows as Array<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>) {
    liveRls.set(r.relname, { security: r.relrowsecurity, forced: r.relforcerowsecurity });
  }
  const liveFunctions = new Set(fnRes.rows.map((r: { proname: string }) => r.proname));
  const liveTriggers = new Set(trgRes.rows.map((r: { relname: string; tgname: string }) => `${r.relname}::${r.tgname}`));

  // Tables
  for (const t of expectedTables) if (!liveTables.has(t)) fail(`table missing: public.${t}`);
  for (const t of liveTables) if (!expectedTables.has(t)) note(`table public.${t} (not in migration)`);

  // RLS enabled + FORCED on every expected table
  for (const t of expectedTables) {
    const st = liveRls.get(t);
    if (!st) continue; // missing table already reported
    if (!st.security) fail(`RLS not enabled: public.${t}`);
    if (!st.forced) fail(`RLS not forced: public.${t}`);
  }

  // Columns (per table not in migration)
  for (const [t, cols] of expectedColumns) {
    const live = liveColumns.get(t) ?? new Set<string>();
    for (const c of cols) if (!live.has(c)) fail(`column missing: public.${t}.${c}`);
    for (const c of live) if (!cols.has(c)) note(`extra column public.${t}.${c}`);
  }

  // Indexes
  for (const i of expectedIndexes) if (!liveIndexes.has(i)) fail(`index missing: ${i}`);
  // Policies (table::policy)
  for (const p of expectedPolicies) if (!livePolicies.has(p)) fail(`policy missing: ${p}`);
  // Functions
  for (const f of expectedFunctions) if (!liveFunctions.has(f)) fail(`function missing: public.${f}`);
  // Triggers (before/after update only — the named ones we declare)
  for (const trg of expectedTriggers) if (!liveTriggers.has(trg)) fail(`trigger missing: ${trg}`);

  await pool.end();

  // ── Summary ──
  console.log('');
  console.log('verify-schema: introspection complete.');
  console.log(`  tables    : expected ${expectedTables.size}, live ${liveTables.size}`);
  console.log(`  columns   : expected ${[...expectedColumns.values()].reduce((n, s) => n + s.size, 0)}`);
  console.log(`  indexes   : expected ${expectedIndexes.size}, live ${liveIndexes.size}`);
  console.log(`  policies  : expected ${expectedPolicies.size}, live ${livePolicies.size}`);
  console.log(`  functions : expected ${expectedFunctions.size}, live ${liveFunctions.size}`);
  console.log(`  triggers  : expected ${expectedTriggers.size}, live ${liveTriggers.size}`);
  console.log(`  RLS-forced: ${[...expectedTables].filter((t) => liveRls.get(t)?.forced).length}/${expectedTables.size}`);

  if (report.missing > 0) {
    console.error(`\nverify-schema: FAILED — ${report.missing} missing artifact(s):`);
    for (const l of missingLines) console.error(`  - ${l}`);
    process.exit(1);
  }
  console.log(`verify-schema: OK${report.extra > 0 ? ` (${report.extra} extra live artifact(s), non-blocking)` : ''}.`);
}

main().catch((e) => { console.error('verify-schema: connection/query error', e); process.exit(1); });
