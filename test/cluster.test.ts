import test from 'node:test';
import assert from 'node:assert/strict';

import { clusterFindings, describeCluster } from '../src/core/cluster.ts';
import type { Finding, WordSpan } from '../src/core/analyze.ts';

function span(text: string, start: number): WordSpan {
  return { text, start, end: start + text.length };
}

function pair(first: WordSpan, second: WordSpan, badness = 800): Finding {
  return { badness, first, second };
}

test('disjoint pairs become separate clusters', () => {
  const a = span('моря', 0);
  const b = span('морем', 10);
  const c = span('свет', 50);
  const d = span('свечи', 60);

  const clusters = clusterFindings([pair(a, b), pair(c, d)]);

  assert.equal(clusters.length, 2);
  assert.deepEqual(
    clusters.map((cluster) => cluster.spans.map((s) => s.text)),
    [
      ['моря', 'морем'],
      ['свет', 'свечи'],
    ],
  );
});

test('a chain of pairs collapses into one cluster', () => {
  const a = span('квадрат', 0);
  const b = span('квадрат', 20);
  const c = span('квадрат', 40);

  const clusters = clusterFindings([pair(a, b), pair(b, c), pair(a, c)]);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].spans.length, 3);
  assert.equal(clusters[0].findings.length, 3);
  assert.equal(clusters[0].repeatedWord, 'квадрат');
  assert.equal(clusters[0].maxBadness, 800);
});

test('different words in one cluster are not reported as a repetition', () => {
  const clusters = clusterFindings([pair(span('длинными', 0), span('длины', 30))]);

  assert.equal(clusters[0].repeatedWord, null);
  assert.equal(describeCluster(clusters[0]), 'похожие слова рядом: длинными, длины');
});

test('clusters are ordered by position', () => {
  const clusters = clusterFindings([
    pair(span('свет', 100), span('свечи', 110)),
    pair(span('моря', 0), span('морем', 10)),
  ]);

  assert.deepEqual(
    clusters.map((cluster) => cluster.spans[0].start),
    [0, 100],
  );
});

test('a cluster keeps the worst badness', () => {
  const a = span('ценен', 0);
  const b = span('ценен', 30);
  const c = span('ценен', 60);

  const clusters = clusterFindings([pair(a, b, 820), pair(b, c, 1180), pair(a, c, 900)]);

  assert.equal(clusters[0].maxBadness, 1180);
});
