#!/usr/bin/env node
/**
 * Summary statistics for tuning: how many findings are literal word repeats,
 * how many involve different forms, and how the count changes with threshold.
 *
 *   node tools/stats.mjs file1.txt file2.txt
 */
import { readFileSync } from 'node:fs';
import { analyze } from '../src/core/analyze.ts';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('usage: node tools/stats.mjs <file.txt> [file2.txt ...]');
  process.exit(2);
}

const THRESHOLDS = [400, 600, 800, 1000, 1200];

for (const file of files) {
  const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const words = (text.match(/[а-яё]+/gi) ?? []).length;
  console.log(`${file} — ${words} words`);
  console.log('  threshold │ pairs │ same word │ per 1000 words');

  for (const threshold of THRESHOLDS) {
    const findings = analyze(text, { sensitivityThreshold: threshold });
    const sameWord = findings.filter(
      (f) => f.first.text.toLowerCase() === f.second.text.toLowerCase(),
    ).length;
    const per1000 = ((findings.length / words) * 1000).toFixed(1);
    console.log(
      `  ${String(threshold).padStart(9)} │ ${String(findings.length).padStart(5)} │ ${String(sameWord).padStart(9)} │ ${per1000}`,
    );
  }
  console.log('');
}
