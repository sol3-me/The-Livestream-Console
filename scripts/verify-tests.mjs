#!/usr/bin/env node
/**
 * Comment-out verification ("manual mutation testing", automated).
 *
 * For each entry in tests/unit/mutations.json:
 *   1. comment out a block of production logic (lines from `start` to `end`, inclusive)
 *      and optionally insert `stub` lines so the file still compiles,
 *   2. run the listed test file,
 *   3. require that at least one test fails ON AN ASSERTION (not a syntax/import error),
 *   4. restore the original file byte-for-byte (always, even on crash).
 *
 * Usage:
 *   node scripts/verify-tests.mjs            # all mutations
 *   node scripts/verify-tests.mjs create     # only mutations whose id contains "create"
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mutationsPath = process.env.TLC_MUTATIONS ?? join(root, 'tests/unit/mutations.json');
const mutations = JSON.parse(readFileSync(mutationsPath, 'utf8'));
const filter = process.argv[2];
const selected = filter ? mutations.filter((m) => m.id.includes(filter)) : mutations;

const tmp = mkdtempSync(join(tmpdir(), 'tlc-verify-'));
const vitestBin = join(root, 'node_modules', 'vitest', 'vitest.mjs');
let failures = 0;

function applyMutation(source, m) {
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(eol);
  // `occurrence` (1-based) picks the Nth line matching `start`, for files with several handlers.
  const matches = lines.flatMap((l, idx) => (l.includes(m.start) ? [idx] : []));
  const startIdx = matches[(m.occurrence ?? 1) - 1];
  if (startIdx === undefined) throw new Error(`start anchor not found: ${m.start} (#${m.occurrence ?? 1})`);
  // Either a fixed number of `lines`, or up to the first line matching `end`.
  let endIdx;
  if (m.lines) {
    endIdx = startIdx + m.lines - 1;
  } else {
    const endRel = lines.slice(startIdx).findIndex((l) => l.includes(m.end ?? m.start));
    if (endRel === -1) throw new Error(`end anchor not found: ${m.end}`);
    endIdx = startIdx + endRel;
  }
  const out = [
    ...lines.slice(0, startIdx),
    ...lines.slice(startIdx, endIdx + 1).map((l) => `// [verify] ${l}`),
    ...(m.stub ?? []),
    ...lines.slice(endIdx + 1),
  ];
  return { text: out.join(eol), commented: endIdx - startIdx + 1 };
}

function runVitest(testFile, reportPath) {
  try {
    execFileSync(process.execPath, [vitestBin, 'run', testFile, '--reporter=json', `--outputFile=${reportPath}`], {
      cwd: root,
      stdio: 'pipe',
      env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
    });
  } catch {
    /* non-zero exit is expected when tests fail */
  }
  return JSON.parse(readFileSync(reportPath, 'utf8'));
}

for (const [i, m] of selected.entries()) {
  const file = join(root, m.file);
  const original = readFileSync(file);
  let verdict;
  try {
    const { text, commented } = applyMutation(original.toString('utf8'), m);
    writeFileSync(file, text);
    const report = runVitest(m.test, join(tmp, `r${i}.json`));
    const suiteErrors = report.testResults.filter((r) => r.message && r.assertionResults.length === 0);
    const failed = report.testResults.flatMap((r) => r.assertionResults).filter((a) => a.status === 'failed');
    const loadError = /SyntaxError|Transform failed|Failed to load|Cannot find module/;
    const assertionFailures = failed.filter((a) => !a.failureMessages.some((msg) => loadError.test(msg)));

    if (suiteErrors.length > 0) {
      verdict = `INVALID  suite failed to load: ${suiteErrors[0].message.split('\n')[0]}`;
    } else if (assertionFailures.length === 0) {
      verdict = 'SURVIVED  no test failed with this logic commented out';
    } else {
      verdict = `KILLED   ${assertionFailures.length}/${failed.length + report.numPassedTests} tests failed on assertions (${commented} lines commented)`;
    }
  } catch (e) {
    verdict = `ERROR    ${e.message}`;
  } finally {
    writeFileSync(file, original);
  }
  if (!verdict.startsWith('KILLED')) failures++;
  console.log(`${verdict.startsWith('KILLED') ? '✓' : '✗'} ${m.id.padEnd(48)} ${verdict}`);
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${selected.length - failures}/${selected.length} mutations killed.`);
process.exit(failures > 0 ? 1 : 0);
