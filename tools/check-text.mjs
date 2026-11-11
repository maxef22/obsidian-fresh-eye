#!/usr/bin/env node
/**
 * Command-line front-end for the core: checks a plain text file and prints the
 * pairs the plugin would underline. Useful for tuning the threshold on real
 * prose without launching Obsidian.
 *
 *   node tools/check-text.mjs story.txt [--threshold=400] [--context=20] [--names] [--json]
 */
import { readFileSync } from 'node:fs';
import { analyze } from '../src/core/analyze.ts';
import { checkProse } from '../src/plugin/prose.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));

if (!file) {
  console.error('usage: node tools/check-text.mjs <file.txt> [--threshold=400] [--context=20] [--names] [--json]');
  process.exit(2);
}

function numberArg(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
}

const threshold = numberArg('threshold', 400);
const contextSize = numberArg('context', 20);
const excludeProperNames = args.includes('--names');
const asJson = args.includes('--json');

const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');

const started = performance.now();
const findings = checkProse(text, {
  contextSize,
  sensitivityThreshold: threshold,
  excludeProperNames,
});
const elapsed = performance.now() - started;

const wordCount = (text.match(/[а-яё]+/gi) ?? []).length;

const lineStarts = [0];
for (let i = 0; i < text.length; i++) {
  if (text[i] === '\n') lineStarts.push(i + 1);
}

function position(offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (lineStarts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: offset - lineStarts[low] + 1 };
}

if (asJson) {
  const rows = findings.map((f) => ({
    badness: Number(f.badness.toFixed(1)),
    ...position(f.first.start),
    first: f.first.text,
    second: f.second.text,
  }));
  console.log(JSON.stringify({ file, words: wordCount, elapsedMs: Number(elapsed.toFixed(1)), findings: rows }, null, 2));
} else {
  for (const f of findings) {
    const { line, column } = position(f.first.start);
    console.log(`${String(line).padStart(5)}:${String(column).padStart(4)}  ${f.first.text} — ${f.second.text}  (${f.badness.toFixed(0)})`);
  }
  console.log('');
  console.log(`${findings.length} pairs in ${wordCount} words (${((findings.length / wordCount) * 1000).toFixed(1)} per 1000 words)`);
  console.log(`${elapsed.toFixed(0)} ms, ${(wordCount / elapsed * 1000).toFixed(0)}k words/s`);
}
