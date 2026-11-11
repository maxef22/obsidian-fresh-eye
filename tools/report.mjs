#!/usr/bin/env node
/**
 * Prints findings together with the sentence they come from, for manual review
 * while tuning the threshold on real prose.
 *
 *   node tools/report.mjs story.txt [--threshold=800] [--limit=40] [--badness]
 */
import { readFileSync } from 'node:fs';
import { analyze } from '../src/core/analyze.ts';
import { checkProse } from '../src/plugin/prose.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('usage: node tools/report.mjs <file.txt> [--threshold=800] [--limit=40] [--badness]');
  process.exit(2);
}

function numberArg(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
}

const threshold = numberArg('threshold', 800);
const limit = numberArg('limit', 40);
const byBadness = args.includes('--badness');

const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const findings = checkProse(text, { sensitivityThreshold: threshold });

const lineStarts = [0];
for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);

function lineOf(offset) {
  let i = lineStarts.length - 1;
  while (i > 0 && lineStarts[i] > offset) i--;
  return i + 1;
}

function sentenceAround(from, to) {
  const stops = ['.', '!', '?', '\n'];
  let start = 0;
  for (let i = from - 1; i >= 0; i--) {
    if (stops.includes(text[i])) {
      start = i + 1;
      break;
    }
  }
  let end = text.length;
  for (let i = to; i < text.length; i++) {
    if (stops.includes(text[i])) {
      end = i + 1;
      break;
    }
  }
  let sentence = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (sentence.length > 220) sentence = '…' + sentence.slice(0, 220) + '…';
  return sentence;
}

const sorted = byBadness
  ? [...findings].sort((a, b) => b.badness - a.badness)
  : [...findings].sort((a, b) => a.first.start - b.first.start);

for (const f of sorted.slice(0, limit)) {
  const line = lineOf(f.first.start);
  console.log(`${String(line).padStart(4)}  ${f.first.text} — ${f.second.text}  (${f.badness.toFixed(0)})`);
  console.log(`      ${sentenceAround(f.first.start, f.second.end)}`);
  console.log('');
}

console.log(`— ${findings.length} findings at threshold ${threshold}, showing ${Math.min(limit, findings.length)}`);
